from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Transaction, User
from app.schemas import TransactionOut, TransactionItemOut
from app.services.pdf_service import generate_invoice_pdf
from app.utils.security import get_current_user_optional

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionOut])
def list_transactions(
    search: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if payment_method and payment_method.lower() != "all":
        query = query.filter(Transaction.payment_method.ilike(payment_method))
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.invoice_number.ilike(term),
                Transaction.payment_method.ilike(term)
            )
        )
    
    transactions = query.order_by(Transaction.created_at.desc()).all()
    results = []
    for t in transactions:
        t_dict = {
            "id": t.id,
            "invoice_number": t.invoice_number,
            "customer_id": t.customer_id,
            "customer_name": t.customer.name if t.customer else "Walk-in Customer",
            "customer_phone": t.customer.phone if t.customer else None,
            "subtotal": t.subtotal,
            "tax": t.tax,
            "discount": t.discount,
            "grand_total": t.grand_total,
            "payment_method": t.payment_method,
            "payment_status": t.payment_status,
            "created_at": t.created_at,
            "items": [
                TransactionItemOut.model_validate(item) for item in t.items
            ]
        }
        results.append(t_dict)
    return results

@router.get("/{transaction_id}", response_model=dict)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    t = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return {
        "id": t.id,
        "invoice_number": t.invoice_number,
        "customer_id": t.customer_id,
        "customer_name": t.customer.name if t.customer else "Walk-in Customer",
        "customer_phone": t.customer.phone if t.customer else None,
        "subtotal": t.subtotal,
        "tax": t.tax,
        "discount": t.discount,
        "grand_total": t.grand_total,
        "payment_method": t.payment_method,
        "payment_status": t.payment_status,
        "created_at": t.created_at,
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
            } for item in t.items
        ]
    }

@router.get("/{transaction_id}/pdf")
def get_transaction_pdf(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    t = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")

    transaction_dict = {
        "invoice_number": t.invoice_number,
        "created_at": t.created_at,
        "customer_name": t.customer.name if t.customer else "Walk-in Customer",
        "customer_phone": t.customer.phone if t.customer else None,
        "payment_method": t.payment_method,
        "subtotal": t.subtotal,
        "tax": t.tax,
        "discount": t.discount,
        "grand_total": t.grand_total,
        "items": [
            {
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit": item.unit,
                "unit_price": item.unit_price,
                "gst_percentage": item.gst_percentage,
                "line_total": item.line_total
            } for item in t.items
        ]
    }

    shop_dict = {
        "shop_name": current_user.shop_name if current_user else "VendorGPT Kirana",
        "shop_owner_name": current_user.shop_owner_name if current_user else "Shop Owner",
        "gst_number": current_user.gst_number if current_user else ""
    }

    pdf_bytes = generate_invoice_pdf(transaction_dict, shop_dict)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={t.invoice_number}.pdf"}
    )
