from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Customer, KhataTransaction
from app.schemas import KhataPaymentRequest, KhataTransactionOut, CustomerOut

router = APIRouter(prefix="/api/khata", tags=["Khata"])

@router.get("/summary", response_model=dict)
def get_khata_summary(db: Session = Depends(get_db)):
    customers_with_due = db.query(Customer).filter(Customer.khata_balance > 0).all()
    total_pending_khata = sum(c.khata_balance for c in customers_with_due)
    
    recent_khata_entries = db.query(KhataTransaction).order_by(KhataTransaction.created_at.desc()).limit(20).all()
    
    return {
        "total_pending_khata": round(total_pending_khata, 2),
        "total_debtors_count": len(customers_with_due),
        "debtors": [
            {
                "customer_id": c.id,
                "name": c.name,
                "phone": c.phone,
                "khata_balance": c.khata_balance
            } for c in customers_with_due
        ],
        "recent_entries": [
            {
                "id": k.id,
                "customer_id": k.customer_id,
                "customer_name": k.customer.name if k.customer else "Unknown",
                "transaction_type": k.transaction_type,
                "amount": k.amount,
                "description": k.description,
                "created_at": k.created_at
            } for k in recent_khata_entries
        ]
    }

@router.get("/{customer_id}", response_model=List[KhataTransactionOut])
def get_customer_khata_ledger(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db.query(KhataTransaction).filter(KhataTransaction.customer_id == customer_id).order_by(KhataTransaction.created_at.desc()).all()

@router.post("/payment", response_model=dict)
def record_khata_payment(payload: KhataPaymentRequest, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

    # Record payment transaction
    khata_entry = KhataTransaction(
        customer_id=customer.id,
        transaction_type="PAYMENT",
        amount=payload.amount,
        description=payload.description or f"Payment received of Rs. {payload.amount}"
    )
    
    # Deduct from customer's khata balance
    customer.khata_balance = max(0.0, customer.khata_balance - payload.amount)

    db.add(khata_entry)
    db.commit()
    db.refresh(customer)

    return {
        "success": True,
        "customer_id": customer.id,
        "paid_amount": payload.amount,
        "remaining_khata_balance": customer.khata_balance,
        "message": f"Payment of Rs. {payload.amount} recorded successfully."
    }
