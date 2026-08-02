import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models import Product, Customer
from app.services.nlp_service import extract_items_from_text
from app.services.fuzzy_service import validate_product_with_db

from app.database import SessionLocal
from app.models import Product, Customer
from app.services.nlp_service import extract_items_from_text
from app.services.fuzzy_service import validate_product_with_db
from app.services.transliteration_service import transliterate_to_telugu

def run_user_tests():
    db = SessionLocal()
    try:
        print("==================================================")
        print("RUNNING VENDORGPT TRANSLITERATION & VOICE TEST SUITE")
        print("==================================================")

        # 1. Test Transliteration Engine
        trans_tests = [
            ("Chicken Masala", "చికెన్ మసాలా"),
            ("Boost", "బూస్ట్"),
            ("Horlicks", "హార్లిక్స్"),
            ("Britannia Biscuits", "బ్రిటానియా బిస్కెట్స్")
        ]
        for eng, expected_tel in trans_tests:
            result_tel = transliterate_to_telugu(eng)
            print(f"[TRANSLITERATE] '{eng}' -> '{result_tel}' (Expected: '{expected_tel}')")
            assert result_tel == expected_tel, f"Transliteration mismatch for {eng}: got {result_tel}"

        # 2. Dynamically Ensure Chicken Masala Product exists
        cm = db.query(Product).filter(Product.product_name == "Chicken Masala").first()
        if not cm:
            cm = Product(
                product_name="Chicken Masala",
                telugu_name=transliterate_to_telugu("Chicken Masala"),
                category="Spices",
                unit="packet",
                selling_price=40.0,
                purchase_price=30.0,
                stock_quantity=50.0,
                active=True
            )
            db.add(cm)
            db.commit()
            db.refresh(cm)
            print(f"[DB] Dynamically created new product: {cm.product_name} (Telugu: {cm.telugu_name})")

        # 3. Test Voice Pipeline for English & Telugu modes
        test_cases = [
            ("రెండు కిలోల బియ్యం", "te", "Rice", 2.0, "kg"),
            ("ఒక కిలో చక్కెర", "te", "Sugar", 1.0, "kg"),
            ("మూడు పాల ప్యాకెట్లు", "te", "Milk", 3.0, "packet"),
            ("మూడు బూస్ట్ ప్యాకెట్లు", "te", "Boost", 3.0, "packet"),
            ("two chicken masala packets", "en", "Chicken Masala", 2.0, "packet"),
            ("రెండు చికెన్ మసాలా ప్యాకెట్లు", "te", "Chicken Masala", 2.0, "packet")
        ]

        for text, lang, expected_name, expected_qty, expected_unit in test_cases:
            print(f"\n--- Testing: '{text}' ({lang}) ---")
            extracted = extract_items_from_text(text, lang, db=db)
            print(f"[NLP] Extracted items: {extracted}")
            assert len(extracted) >= 1, f"Failed extraction for '{text}'"

            for item in extracted:
                val = validate_product_with_db(item['raw_product'], item['quantity'], item['unit'], db)
                print(f"[MATCH] Product={val['matched_product_name']}, Qty={val['quantity']}, Unit={val['matched_unit']}, Confidence={val['confidence']}%, Status={val['status']}")
                print(f"[CART] products added: {val['matched_product_name']} x {val['quantity']} {val['matched_unit']}")
                assert val['status'] == 'confirmed', f"Test failed for '{text}': Status is {val['status']} instead of confirmed"
                if expected_name:
                    assert val['matched_product_name'] == expected_name, f"Expected product {expected_name}, got {val['matched_product_name']}"

        print("\n==================================================")
        print("🎉 ALL TRANSLITERATION & DYNAMIC PRODUCT VOICE TESTS PASSED PERFECTLY!")
        print("==================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_user_tests()
