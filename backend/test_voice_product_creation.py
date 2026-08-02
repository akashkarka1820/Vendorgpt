import sys
import os
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import Product
from app.schemas import ProductCreate, ValidateItemRequest
from app.routes.products import create_product, validate_products
from app.services.transliteration_service import transliterate_to_telugu, reverse_transliterate_telugu

def test_voice_product_creation_and_billing():
    print("=== Testing Multilingual Voice Product Creation & Billing Pipeline ===")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Reverse Transliteration Test for Rural Vendor Telugu Speech
        telugu_speech = "చికెన్ మసాలా"
        english_alias = reverse_transliterate_telugu(telugu_speech)
        print(f"Vendor Spoke (Telugu): {telugu_speech}")
        print(f"Auto Reverse-Transliterated Search Alias: {english_alias}")
        assert english_alias == "Chicken Masala", f"Expected 'Chicken Masala', got '{english_alias}'"

        # 2. Deactivate any old test chicken masala to ensure clean product creation test
        old_prods = db.query(Product).filter(Product.product_name.ilike("%Chicken Masala%")).all()
        for op in old_prods:
            op.active = False
        db.commit()

        # 3. Create Product using ONLY Telugu speech input (product_name is auto-filled)
        payload = ProductCreate(
            product_name=None, # Vendor did not type English!
            telugu_name=telugu_speech,
            category="Spices",
            unit="packet",
            selling_price=50.0,
            purchase_price=35.0,
            gst_percentage=5.0,
            stock_quantity=20.0
        )

        new_prod = create_product(payload=payload, db=db)
        print(f"\n[CREATED] Product ID: {new_prod.id}")
        print(f"   Canonical English Name: '{new_prod.product_name}'")
        print(f"   Telugu Name: '{new_prod.telugu_name}'")
        print(f"   Unit: {new_prod.unit}, Price: ₹{new_prod.selling_price}, Stock: {new_prod.stock_quantity}")

        assert new_prod.id is not None
        assert new_prod.product_name == "Chicken Masala"
        assert new_prod.telugu_name == "చికెన్ మసాలా"

        # 4. Immediate Telugu Voice Billing Recognition Test
        print("\n--- Testing Telugu Voice Billing Recognition ---")
        telugu_item = ValidateItemRequest(
            raw_product="చికెన్ మసాలా",
            quantity=2.0,
            unit="packet"
        )
        te_resp = validate_products(items=[telugu_item], db=db)
        te_match = te_resp.items[0]
        print(f"Telugu Query: '{telugu_item.raw_product}'")
        print(f"Match Status: {te_match.status}, Confidence: {te_match.confidence}%")
        print(f"Matched Product ID: {te_match.matched_product_id}, Name: '{te_match.matched_product_name}'")
        assert te_match.status == "confirmed"
        assert te_match.matched_product_id == new_prod.id
        assert te_match.confidence >= 85.0

        # 5. Immediate English Voice Billing Recognition Test
        print("\n--- Testing English Voice Billing Recognition ---")
        english_item = ValidateItemRequest(
            raw_product="chicken masala",
            quantity=2.0,
            unit="packet"
        )
        en_resp = validate_products(items=[english_item], db=db)
        en_match = en_resp.items[0]
        print(f"English Query: '{english_item.raw_product}'")
        print(f"Match Status: {en_match.status}, Confidence: {en_match.confidence}%")
        print(f"Matched Product ID: {en_match.matched_product_id}, Name: '{en_match.matched_product_name}'")
        assert en_match.status == "confirmed"
        assert en_match.matched_product_id == new_prod.id
        assert en_match.confidence >= 85.0

        print("\nSUCCESS! Both Telugu & English voice billing resolved to the exact same canonical Product ID!")

    finally:
        db.close()

if __name__ == "__main__":
    test_voice_product_creation_and_billing()
