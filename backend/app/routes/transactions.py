from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Transaction, User
from app.schemas import TransactionOut, TransactionItemOut
from app.services.pdf_service import generate_invoice_pdf
from app.utils.security import get_current_user


router = APIRouter(
    prefix="/api/transactions",
    tags=["Transactions"]
)


# ---------------------------------------------------------
# LIST TRANSACTIONS
# ---------------------------------------------------------

@router.get("", response_model=List[TransactionOut])
def list_transactions(
    search: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only transactions belonging to the logged-in vendor
    query = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    )

    if payment_method and payment_method.lower() != "all":
        query = query.filter(
            Transaction.payment_method.ilike(payment_method)
        )

    if search:
        term = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Transaction.invoice_number.ilike(term),
                Transaction.payment_method.ilike(term)
            )
        )

    transactions = (
        query
        .order_by(Transaction.created_at.desc())
        .all()
    )

    results = []

    for t in transactions:

        t_dict = {
            "id": t.id,
            "invoice_number": t.invoice_number,
            "customer_id": t.customer_id,
            "customer_name": (
                t.customer.name
                if t.customer
                else "Walk-in Customer"
            ),
            "customer_phone": (
                t.customer.phone
                if t.customer
                else None
            ),
            "subtotal": t.subtotal,
            "tax": t.tax,
            "discount": t.discount,
            "grand_total": t.grand_total,
            "payment_method": t.payment_method,
            "payment_status": t.payment_status,
            "created_at": t.created_at,
            "items": [
                TransactionItemOut.model_validate(item)
                for item in t.items
            ]
        }

        results.append(t_dict)

    return results


# ---------------------------------------------------------
# GET SINGLE TRANSACTION
# ---------------------------------------------------------

@router.get("/{transaction_id}", response_model=dict)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Important:
    # A vendor can only access their own transaction.
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
        .first()
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    return {
        "id": transaction.id,
        "invoice_number": transaction.invoice_number,
        "customer_id": transaction.customer_id,
        "customer_name": (
            transaction.customer.name
            if transaction.customer
            else "Walk-in Customer"
        ),
        "customer_phone": (
            transaction.customer.phone
            if transaction.customer
            else None
        ),
        "subtotal": transaction.subtotal,
        "tax": transaction.tax,
        "discount": transaction.discount,
        "grand_total": transaction.grand_total,
        "payment_method": transaction.payment_method,
        "payment_status": transaction.payment_status,
        "created_at": transaction.created_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit": item.unit,
                "unit_price": item.unit_price,
                "gst_percentage": item.gst_percentage,
                "line_total": item.line_total
            }
            for item in transaction.items
        ]
    }


# ---------------------------------------------------------
# GENERATE TRANSACTION PDF
# ---------------------------------------------------------

@router.get("/{transaction_id}/pdf")
def get_transaction_pdf(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only allow the logged-in vendor to generate
    # a PDF for their own transaction.
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
        .first()
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    transaction_dict = {
        "invoice_number": transaction.invoice_number,
        "created_at": transaction.created_at,
        "customer_name": (
            transaction.customer.name
            if transaction.customer
            else "Walk-in Customer"
        ),
        "customer_phone": (
            transaction.customer.phone
            if transaction.customer
            else None
        ),
        "payment_method": transaction.payment_method,
        "subtotal": transaction.subtotal,
        "tax": transaction.tax,
        "discount": transaction.discount,
        "grand_total": transaction.grand_total,
        "items": [
            {
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit": item.unit,
                "unit_price": item.unit_price,
                "gst_percentage": item.gst_percentage,
                "line_total": item.line_total
            }
            for item in transaction.items
        ]
    }

    shop_dict = {
        "shop_name": current_user.shop_name,
        "shop_owner_name": current_user.shop_owner_name,
        "gst_number": current_user.gst_number or ""
    }

    pdf_bytes = generate_invoice_pdf(
        transaction_dict,
        shop_dict
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f"inline; "
                f"filename={transaction.invoice_number}.pdf"
            )
        }
    )