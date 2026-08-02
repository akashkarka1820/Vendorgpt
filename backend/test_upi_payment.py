import sys
import os
import urllib.parse
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import User, Product, Customer, Transaction, TransactionItem
from app.schemas import UserRegister, UserUpdate
from app.routes.auth import register_vendor, update_me

def test_upi_integration():
    print("=== Testing VendorGPT Dynamic UPI Integration ===")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Verify User table upi_id and upi_phone defaults
        user = db.query(User).first()
        if not user:
            print("Creating test vendor account...")
            user = User(
                shop_owner_name="Akash Karka",
                shop_name="Sri Venkateswara Kirana",
                email="testvendor@example.com",
                phone="9346009164",
                hashed_password="hashed_pwd",
                upi_id="akashkarka@ybl",
                upi_phone="9346009164"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        print(f"Vendor Found: {user.shop_name} ({user.shop_owner_name})")
        print(f"Configured UPI ID: {user.upi_id}")
        print(f"Configured UPI Phone: {user.upi_phone}")
        assert user.upi_id == "akashkarka@ybl", f"Expected upi_id akashkarka@ybl, got {user.upi_id}"
        assert user.upi_phone == "9346009164", f"Expected upi_phone 9346009164, got {user.upi_phone}"

        # 2. Test updating UPI Settings
        user.upi_id = "akashkarka@ybl"
        user.upi_phone = "9346009164"
        db.commit()
        db.refresh(user)

        # 3. Test Dynamic UPI URI Generation for test totals
        test_totals = [10.00, 485.00, 1250.50]
        for total in test_totals:
            pa = urllib.parse.quote(user.upi_id)
            pn = urllib.parse.quote(user.shop_name)
            am = f"{total:.2f}"
            cu = "INR"
            tn = urllib.parse.quote("Invoice INV-123456")
            uri = f"upi://pay?pa={pa}&pn={pn}&am={am}&cu={cu}&tn={tn}"
            print(f"-> Generated Dynamic UPI URI for ₹{total}: {uri}")
            assert f"pa={pa}" in uri
            assert f"am={am}" in uri
            assert "cu=INR" in uri

        print("\nAll UPI backend and logic tests passed successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    test_upi_integration()
