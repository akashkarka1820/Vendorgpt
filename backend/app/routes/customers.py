from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Customer, Transaction, KhataTransaction, User
from app.schemas import CustomerCreate, CustomerUpdate, CustomerOut
from app.utils.security import get_current_user


router = APIRouter(prefix="/api/customers", tags=["Customers"])


# ---------------------------------------------------------
# LIST CUSTOMERS
# ---------------------------------------------------------

@router.get("", response_model=List[CustomerOut])
def list_customers(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Customer).filter(
        Customer.user_id == current_user.id
    )

    if search:
        term = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Customer.name.ilike(term),
                Customer.phone.ilike(term),
                Customer.email.ilike(term)
            )
        )

    return query.order_by(Customer.name.asc()).all()


# ---------------------------------------------------------
# CREATE CUSTOMER
# ---------------------------------------------------------

@router.post(
    "",
    response_model=CustomerOut,
    status_code=status.HTTP_201_CREATED
)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Phone number only needs to be unique within
    # the current vendor's customers.
    existing = db.query(Customer).filter(
        Customer.user_id == current_user.id,
        Customer.phone == payload.phone
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Customer with this phone number already exists"
        )

    customer = Customer(
        user_id=current_user.id,
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        khata_balance=0.0
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


# ---------------------------------------------------------
# GET CUSTOMER DETAILS
# ---------------------------------------------------------

@router.get("/{customer_id}", response_model=dict)
def get_customer_details(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.user_id == current_user.id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    # Only transactions belonging to the current vendor
    # and this customer.
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.id == Transaction.id,
            Transaction.user_id == current_user.id,
            Transaction.customer_id == customer_id
        )
        .order_by(Transaction.created_at.desc())
        .all()
    )

    # Only Khata entries belonging to the current vendor
    # and this customer.
    khata_entries = (
        db.query(KhataTransaction)
        .filter(
            KhataTransaction.user_id == current_user.id,
            KhataTransaction.customer_id == customer_id
        )
        .order_by(KhataTransaction.created_at.desc())
        .all()
    )

    return {
        "customer": CustomerOut.model_validate(customer),

        "total_purchases_count": len(transactions),

        "total_spent": sum(
            t.grand_total for t in transactions
        ),

        "recent_transactions": [
            {
                "id": t.id,
                "invoice_number": t.invoice_number,
                "grand_total": t.grand_total,
                "payment_method": t.payment_method,
                "created_at": t.created_at
            }
            for t in transactions[:10]
        ],

        "khata_history": [
            {
                "id": k.id,
                "transaction_type": k.transaction_type,
                "amount": k.amount,
                "description": k.description,
                "created_at": k.created_at
            }
            for k in khata_entries
        ]
    }


# ---------------------------------------------------------
# UPDATE CUSTOMER
# ---------------------------------------------------------

@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.user_id == current_user.id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    update_data = payload.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(customer, key, value)

    db.commit()
    db.refresh(customer)

    return customer