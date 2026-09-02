from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product, InventoryMovement, User
from app.schemas import (
    StockAdjustmentRequest,
    InventoryMovementOut
)
from app.utils.security import get_current_user


router = APIRouter(
    prefix="/api/inventory",
    tags=["Inventory"]
)


# ---------------------------------------------------------
# INVENTORY STATUS
# ---------------------------------------------------------

@router.get("", response_model=List[dict])
def get_inventory_status(
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    products = (
        db.query(Product)
        .filter(
            Product.user_id == current_user.id,
            Product.active == True
        )
        .order_by(Product.product_name.asc())
        .all()
    )

    results = []

    for p in products:

        if p.stock_quantity <= 0:
            stock_status = "OUT OF STOCK"

        elif p.stock_quantity <= p.minimum_stock:
            stock_status = "LOW STOCK"

        else:
            stock_status = "IN STOCK"

        if status_filter and status_filter.upper() != "ALL":
            if stock_status != status_filter.upper():
                continue

        results.append({
            "id": p.id,
            "product_name": p.product_name,
            "telugu_name": p.telugu_name,
            "category": p.category,
            "current_stock": p.stock_quantity,
            "minimum_stock": p.minimum_stock,
            "unit": p.unit,
            "status": stock_status,
            "selling_price": p.selling_price
        })

    return results


# ---------------------------------------------------------
# LOW STOCK PRODUCTS
# ---------------------------------------------------------

@router.get("/low-stock", response_model=List[dict])
def get_low_stock_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    products = (
        db.query(Product)
        .filter(
            Product.user_id == current_user.id,
            Product.active == True,
            Product.stock_quantity <= Product.minimum_stock
        )
        .all()
    )

    return [
        {
            "id": p.id,
            "product_name": p.product_name,
            "telugu_name": p.telugu_name,
            "current_stock": p.stock_quantity,
            "minimum_stock": p.minimum_stock,
            "unit": p.unit,
            "status": (
                "OUT OF STOCK"
                if p.stock_quantity <= 0
                else "LOW STOCK"
            )
        }
        for p in products
    ]


# ---------------------------------------------------------
# MANUAL STOCK ADJUSTMENT
# ---------------------------------------------------------

@router.post("/adjust", response_model=dict)
def adjust_stock(
    payload: StockAdjustmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # IMPORTANT:
    # Only allow the logged-in vendor to modify
    # their own product.
    product = (
        db.query(Product)
        .filter(
            Product.id == payload.product_id,
            Product.user_id == current_user.id,
            Product.active == True
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    change_type = payload.change_type.upper()
    qty = abs(payload.quantity)

    if change_type == "ADDITION":

        product.stock_quantity += qty

    elif change_type == "DEDUCTION":

        product.stock_quantity = max(
            0.0,
            product.stock_quantity - qty
        )

    elif change_type == "ADJUSTMENT":

        product.stock_quantity = qty

    else:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid change_type. "
                "Must be ADDITION, DEDUCTION, or ADJUSTMENT"
            )
        )

    # -----------------------------------------------------
    # CREATE INVENTORY MOVEMENT
    # -----------------------------------------------------

    movement = InventoryMovement(
        user_id=current_user.id,
        product_id=product.id,
        change_type=change_type,
        quantity=qty,
        reference_id="MANUAL",
        note=(
            payload.note
            or f"Manual stock {change_type.lower()}"
        )
    )

    db.add(movement)

    db.commit()
    db.refresh(product)

    return {
        "success": True,
        "product_id": product.id,
        "product_name": product.product_name,
        "new_stock_quantity": product.stock_quantity,
        "unit": product.unit
    }


# ---------------------------------------------------------
# INVENTORY MOVEMENT HISTORY
# ---------------------------------------------------------

@router.get(
    "/movements",
    response_model=List[InventoryMovementOut]
)
def get_inventory_movements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    movements = (
        db.query(InventoryMovement)
        .filter(
            InventoryMovement.user_id == current_user.id
        )
        .order_by(
            InventoryMovement.created_at.desc()
        )
        .limit(50)
        .all()
    )

    result = []

    for movement in movements:

        result.append(
            InventoryMovementOut(
                id=movement.id,
                product_id=movement.product_id,
                product_name=(
                    movement.product.product_name
                    if movement.product
                    else "Unknown"
                ),
                change_type=movement.change_type,
                quantity=movement.quantity,
                reference_id=movement.reference_id,
                note=movement.note,
                created_at=movement.created_at
            )
        )

    return result