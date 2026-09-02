from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Product,
    Customer,
    Transaction,
    TransactionItem,
    KhataTransaction,
    InventoryMovement,
    User
)
from app.schemas import (
    BillingPreviewRequest,
    BillingPreviewResponse,
    LineItemPreview,
    CheckoutRequest
)
from app.utils.security import get_current_user


router = APIRouter(
    prefix="/api/billing",
    tags=["Billing"]
)


# ---------------------------------------------------------
# GENERATE INVOICE NUMBER
# ---------------------------------------------------------

def generate_invoice_number(
    db: Session,
    user_id: int
) -> str:
    """
    Generates a globally unique invoice number.

    Example:
    INV-2026-00001
    """

    year = datetime.now().year

    # Start with the total number of transactions.
    count = db.query(Transaction).count() + 1

    invoice_number = f"INV-{year}-{count:05d}"

    # Make sure the number is globally unique.
    while db.query(Transaction).filter(
        Transaction.invoice_number == invoice_number
    ).first():
        count += 1
        invoice_number = f"INV-{year}-{count:05d}"

    return invoice_number

# ---------------------------------------------------------
# BILL PREVIEW
# ---------------------------------------------------------

@router.post(
    "/preview",
    response_model=BillingPreviewResponse
)
def preview_bill(
    payload: BillingPreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    line_previews = []

    subtotal = 0.0
    total_tax = 0.0

    warnings = []

    can_checkout = True

    for item in payload.items:

        # Only search products belonging to
        # the currently logged-in vendor.
        product = (
            db.query(Product)
            .filter(
                Product.id == item.product_id,
                Product.user_id == current_user.id,
                Product.active == True
            )
            .first()
        )

        if not product:

            warnings.append(
                f"Product ID {item.product_id} "
                f"not found in database."
            )

            can_checkout = False
            continue

        # Use requested price if supplied,
        # otherwise use database selling price.
        unit_price = (
            item.unit_price
            if item.unit_price > 0
            else product.selling_price
        )

        gst_pct = product.gst_percentage

        line_total_before_tax = (
            item.quantity * unit_price
        )

        gst_amount = (
            line_total_before_tax
            * (gst_pct / 100.0)
        )

        line_total = (
            line_total_before_tax
            + gst_amount
        )

        subtotal += line_total_before_tax

        total_tax += gst_amount

        # Check stock.
        stock_sufficient = (
            product.stock_quantity >= item.quantity
        )

        if not stock_sufficient:

            can_checkout = False

            warnings.append(
                f"Insufficient stock for "
                f"{product.product_name}. "
                f"Available: "
                f"{product.stock_quantity} "
                f"{product.unit}, "
                f"Requested: "
                f"{item.quantity} "
                f"{item.unit}."
            )

        line_previews.append(
            LineItemPreview(
                product_id=product.id,
                product_name=product.product_name,
                quantity=item.quantity,
                unit=item.unit or product.unit,
                unit_price=unit_price,
                gst_percentage=gst_pct,
                gst_amount=round(gst_amount, 2),
                line_total=round(line_total, 2),
                stock_available=product.stock_quantity,
                stock_sufficient=stock_sufficient
            )
        )

    grand_total = max(
        0.0,
        (subtotal + total_tax)
        - payload.overall_discount
    )

    return BillingPreviewResponse(
        line_items=line_previews,
        subtotal=round(subtotal, 2),
        total_tax=round(total_tax, 2),
        discount=round(
            payload.overall_discount,
            2
        ),
        grand_total=round(
            grand_total,
            2
        ),
        can_checkout=can_checkout,
        warnings=warnings
    )


# ---------------------------------------------------------
# CHECKOUT
# ---------------------------------------------------------

@router.post(
    "/checkout",
    response_model=dict,
    status_code=status.HTTP_201_CREATED
)
def checkout_bill(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # -----------------------------------------------------
    # VALIDATE CART
    # -----------------------------------------------------

    if not payload.items:

        raise HTTPException(
            status_code=400,
            detail="Cannot checkout an empty cart"
        )

    # -----------------------------------------------------
    # KHATA REQUIRES CUSTOMER
    # -----------------------------------------------------

    if (
        payload.payment_method.lower() == "khata"
        and not payload.customer_id
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Khata payment requires selecting "
                "a registered customer. "
                "Anonymous Khata transactions "
                "are not allowed."
            )
        )

    # -----------------------------------------------------
    # VALIDATE CUSTOMER
    # -----------------------------------------------------

    customer = None

    if payload.customer_id:

        customer = (
            db.query(Customer)
            .filter(
                Customer.id == payload.customer_id,
                Customer.user_id == current_user.id
            )
            .first()
        )

        if not customer:

            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )

    # -----------------------------------------------------
    # CHECK ALL PRODUCTS BEFORE CHANGING ANYTHING
    # -----------------------------------------------------

    products = {}

    for item in payload.items:

        product = (
            db.query(Product)
            .filter(
                Product.id == item.product_id,
                Product.user_id == current_user.id,
                Product.active == True
            )
            .first()
        )

        if not product:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Product ID "
                    f"{item.product_id} "
                    f"not found"
                )
            )

        if product.stock_quantity < item.quantity:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient Stock for "
                    f"{product.product_name}. "
                    f"Requested: "
                    f"{item.quantity} "
                    f"{item.unit}, "
                    f"Available: "
                    f"{product.stock_quantity} "
                    f"{product.unit}."
                )
            )

        products[item.product_id] = product

    # -----------------------------------------------------
    # ATOMIC DATABASE TRANSACTION
    # -----------------------------------------------------

    try:

        # Generate invoice number only from
        # current vendor's transactions.
        inv_num = generate_invoice_number(
            db,
            current_user.id
        )

        # -------------------------------------------------
        # CREATE TRANSACTION
        # -------------------------------------------------

        transaction = Transaction(
            user_id=current_user.id,
            invoice_number=inv_num,
            customer_id=(
                customer.id
                if customer
                else None
            ),
            subtotal=0.0,
            tax=0.0,
            discount=payload.discount,
            grand_total=0.0,
            payment_method=payload.payment_method,
            payment_status="Completed"
        )

        db.add(transaction)

        # Get transaction ID.
        db.flush()

        subtotal_acc = 0.0
        tax_acc = 0.0

        # -------------------------------------------------
        # PROCESS EACH BILL ITEM
        # -------------------------------------------------

        for item in payload.items:

            product = products[item.product_id]

            unit_price = (
                item.unit_price
                if item.unit_price > 0
                else product.selling_price
            )

            gst_pct = product.gst_percentage

            line_base = (
                item.quantity * unit_price
            )

            line_tax = (
                line_base
                * (gst_pct / 100.0)
            )

            line_total = (
                line_base
                + line_tax
            )

            subtotal_acc += line_base

            tax_acc += line_tax

            # ---------------------------------------------
            # TRANSACTION ITEM
            # ---------------------------------------------

            transaction_item = TransactionItem(
                transaction_id=transaction.id,
                product_id=product.id,
                product_name=product.product_name,
                quantity=item.quantity,
                unit=item.unit or product.unit,
                unit_price=unit_price,
                gst_percentage=gst_pct,
                line_total=round(
                    line_total,
                    2
                )
            )

            db.add(transaction_item)

            # ---------------------------------------------
            # DEDUCT STOCK
            # ---------------------------------------------

            product.stock_quantity = max(
                0.0,
                product.stock_quantity
                - item.quantity
            )

            # ---------------------------------------------
            # INVENTORY MOVEMENT
            # ---------------------------------------------

            inventory_movement = InventoryMovement(
                user_id=current_user.id,
                product_id=product.id,
                change_type="DEDUCTION",
                quantity=item.quantity,
                reference_id=inv_num,
                note=f"Sold via {inv_num}"
            )

            db.add(inventory_movement)

        # -------------------------------------------------
        # CALCULATE TRANSACTION TOTALS
        # -------------------------------------------------

        transaction.subtotal = round(
            subtotal_acc,
            2
        )

        transaction.tax = round(
            tax_acc,
            2
        )

        grand_total = max(
            0.0,
            (subtotal_acc + tax_acc)
            - payload.discount
        )

        transaction.grand_total = round(
            grand_total,
            2
        )

        # -------------------------------------------------
        # HANDLE KHATA
        # -------------------------------------------------

        if (
            payload.payment_method.lower() == "khata"
            and customer
        ):

            customer.khata_balance = round(
                customer.khata_balance
                + grand_total,
                2
            )

            khata_entry = KhataTransaction(
                user_id=current_user.id,
                customer_id=customer.id,
                transaction_type="CREDIT",
                amount=grand_total,
                reference_invoice_id=transaction.id,
                description=(
                    f"Credit bill purchase "
                    f"#{inv_num}"
                )
            )

            db.add(khata_entry)

        # -------------------------------------------------
        # COMMIT EVERYTHING
        # -------------------------------------------------

        db.commit()

        db.refresh(transaction)

        return {
            "success": True,
            "invoice_number": inv_num,
            "transaction_id": transaction.id,
            "grand_total": transaction.grand_total,
            "payment_method": transaction.payment_method,
            "message": (
                "Checkout completed successfully"
            )
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Checkout failed: {str(e)}"
        )