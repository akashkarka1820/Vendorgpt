import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import User, Product, Customer, Transaction, TransactionItem, KhataTransaction, InventoryMovement
from app.utils.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Shop Vendor User
        existing_vendor = db.query(User).filter(User.email == "vendor@kirana.com").first()
        if not existing_vendor:
            vendor = User(
                shop_owner_name="Srikanth Reddy",
                shop_name="Sri Venkateswara Kirana & General Store",
                email="vendor@kirana.com",
                phone="9876543210",
                hashed_password=get_password_hash("vendor123"),
                gst_number="36AAAAA0000A1Z5",
                shop_address="Plot No 42, Main Road, Hanamkonda, Telangana"
            )
            db.add(vendor)
            db.commit()
            print("✓ Seeded primary vendor user (vendor@kirana.com / vendor123)")

        # 2. Seed Products catalog with English & Telugu names
        initial_products = [
            # Groceries & Grains
            {"product_name": "Rice", "telugu_name": "బియ్యం", "category": "Grains", "unit": "kg", "selling_price": 60.0, "purchase_price": 48.0, "gst_percentage": 0.0, "stock_quantity": 150.0, "minimum_stock": 20.0},
            {"product_name": "Sugar", "telugu_name": "చక్కెర", "category": "Groceries", "unit": "kg", "selling_price": 45.0, "purchase_price": 38.0, "gst_percentage": 5.0, "stock_quantity": 80.0, "minimum_stock": 15.0},
            {"product_name": "Toor Dal", "telugu_name": "కందిపప్పు", "category": "Pulses", "unit": "kg", "selling_price": 160.0, "purchase_price": 135.0, "gst_percentage": 0.0, "stock_quantity": 60.0, "minimum_stock": 10.0},
            {"product_name": "Moong Dal", "telugu_name": "పెసరపప్పు", "category": "Pulses", "unit": "kg", "selling_price": 140.0, "purchase_price": 115.0, "gst_percentage": 0.0, "stock_quantity": 40.0, "minimum_stock": 10.0},
            {"product_name": "Chana Dal", "telugu_name": "శనగపప్పు", "category": "Pulses", "unit": "kg", "selling_price": 95.0, "purchase_price": 78.0, "gst_percentage": 0.0, "stock_quantity": 5.0, "minimum_stock": 10.0}, # Low stock demo!
            {"product_name": "Sunflower Oil", "telugu_name": "నూనె", "category": "Oils", "unit": "liter", "selling_price": 135.0, "purchase_price": 115.0, "gst_percentage": 5.0, "stock_quantity": 50.0, "minimum_stock": 12.0},
            {"product_name": "Groundnut Oil", "telugu_name": "వేరుశనగ నూనె", "category": "Oils", "unit": "liter", "selling_price": 180.0, "purchase_price": 155.0, "gst_percentage": 5.0, "stock_quantity": 30.0, "minimum_stock": 8.0},
            {"product_name": "Tata Salt", "telugu_name": "ఉప్పు", "category": "Spices", "unit": "packet", "selling_price": 28.0, "purchase_price": 22.0, "gst_percentage": 0.0, "stock_quantity": 100.0, "minimum_stock": 20.0},
            {"product_name": "Wheat Flour Atta", "telugu_name": "గోధుమ పిండి", "category": "Flour", "unit": "kg", "selling_price": 55.0, "purchase_price": 42.0, "gst_percentage": 5.0, "stock_quantity": 70.0, "minimum_stock": 15.0},
            {"product_name": "Turmeric Powder", "telugu_name": "పసుపు", "category": "Spices", "unit": "packet", "selling_price": 35.0, "purchase_price": 25.0, "gst_percentage": 5.0, "stock_quantity": 40.0, "minimum_stock": 10.0},
            {"product_name": "Red Chilli Powder", "telugu_name": "కారం పొడి", "category": "Spices", "unit": "packet", "selling_price": 65.0, "purchase_price": 48.0, "gst_percentage": 5.0, "stock_quantity": 3.0, "minimum_stock": 10.0}, # Low stock demo!

            # Dairy & Beverages
            {"product_name": "Milk", "telugu_name": "పాలు", "category": "Dairy", "unit": "packet", "selling_price": 30.0, "purchase_price": 25.0, "gst_percentage": 0.0, "stock_quantity": 60.0, "minimum_stock": 15.0},
            {"product_name": "Curd", "telugu_name": "పెరుగు", "category": "Dairy", "unit": "packet", "selling_price": 35.0, "purchase_price": 28.0, "gst_percentage": 5.0, "stock_quantity": 25.0, "minimum_stock": 10.0},
            {"product_name": "Tea Powder", "telugu_name": "టీ పొడి", "category": "Beverages", "unit": "packet", "selling_price": 120.0, "purchase_price": 95.0, "gst_percentage": 5.0, "stock_quantity": 35.0, "minimum_stock": 8.0},

            # Snacks & FMCG
            {"product_name": "Britannia Biscuits", "telugu_name": "బిస్కెట్లు", "category": "Snacks", "unit": "packet", "selling_price": 25.0, "purchase_price": 19.0, "gst_percentage": 18.0, "stock_quantity": 90.0, "minimum_stock": 20.0},
            {"product_name": "Bathing Soap", "telugu_name": "సబ్బు", "category": "Personal Care", "unit": "piece", "selling_price": 40.0, "purchase_price": 30.0, "gst_percentage": 18.0, "stock_quantity": 50.0, "minimum_stock": 10.0},
        ]

        for p_data in initial_products:
            p_exist = db.query(Product).filter(Product.product_name == p_data["product_name"]).first()
            if not p_exist:
                p = Product(**p_data, active=True)
                db.add(p)
            else:
                p_exist.stock_quantity = p_data["stock_quantity"]
                p_exist.active = True
        db.commit()
        print("✓ Seeded product catalog")

        # 3. Seed Customers
        customers_data = [
            {"name": "Ramesh Kumar", "phone": "9988776655", "email": "ramesh@gmail.com", "address": "Station Road, Hanamkonda", "khata_balance": 800.0},
            {"name": "Srinivas Rao", "phone": "9876501234", "email": "srinivas@gmail.com", "address": "Subedari, Warangal", "khata_balance": 1450.0},
            {"name": "Anitha Laxmi", "phone": "9123456789", "email": "anitha@gmail.com", "address": "Kakatiya Colony, Warangal", "khata_balance": 0.0},
        ]

        for c_data in customers_data:
            c_exist = db.query(Customer).filter(Customer.phone == c_data["phone"]).first()
            if not c_exist:
                c = Customer(**c_data)
                db.add(c)
        db.commit()
        print("✓ Seeded customer directory & Khata balances")

        # 4. Seed sample past transactions for real chart/analytics viewing
        tx_check = db.query(Transaction).count()
        if tx_check == 0:
            ramesh = db.query(Customer).filter(Customer.name == "Ramesh Kumar").first()
            rice = db.query(Product).filter(Product.product_name == "Rice").first()
            sugar = db.query(Product).filter(Product.product_name == "Sugar").first()
            milk = db.query(Product).filter(Product.product_name == "Milk").first()

            # Seed transaction 1 (Yesterday - Cash)
            t1 = Transaction(
                invoice_number="INV-2026-00001",
                customer_id=None,
                subtotal=165.0,
                tax=2.25,
                discount=0.0,
                grand_total=167.25,
                payment_method="Cash",
                payment_status="Completed",
                created_at=datetime.utcnow() - timedelta(days=1)
            )
            db.add(t1)
            db.flush()

            ti1 = TransactionItem(transaction_id=t1.id, product_id=rice.id, product_name="Rice", quantity=2.0, unit="kg", unit_price=60.0, gst_percentage=0.0, line_total=120.0)
            ti2 = TransactionItem(transaction_id=t1.id, product_id=sugar.id, product_name="Sugar", quantity=1.0, unit="kg", unit_price=45.0, gst_percentage=5.0, line_total=47.25)
            db.add_all([ti1, ti2])

            # Seed transaction 2 (Today - Khata)
            t2 = Transaction(
                invoice_number="INV-2026-00002",
                customer_id=ramesh.id if ramesh else None,
                subtotal=210.0,
                tax=0.0,
                discount=10.0,
                grand_total=200.0,
                payment_method="Khata",
                payment_status="Completed",
                created_at=datetime.utcnow()
            )
            db.add(t2)
            db.flush()

            ti3 = TransactionItem(transaction_id=t2.id, product_id=rice.id, product_name="Rice", quantity=2.0, unit="kg", unit_price=60.0, gst_percentage=0.0, line_total=120.0)
            ti4 = TransactionItem(transaction_id=t2.id, product_id=milk.id, product_name="Milk", quantity=3.0, unit="packet", unit_price=30.0, gst_percentage=0.0, line_total=90.0)
            db.add_all([ti3, ti4])

            if ramesh:
                khata_rec = KhataTransaction(
                    customer_id=ramesh.id,
                    transaction_type="CREDIT",
                    amount=200.0,
                    reference_invoice_id=t2.id,
                    description="Credit bill purchase #INV-2026-00002",
                    created_at=datetime.utcnow()
                )
                db.add(khata_rec)

            db.commit()
            print("✓ Seeded sample past transactions & Khata records")

        print("🎉 Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
