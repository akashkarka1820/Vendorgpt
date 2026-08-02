import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal, Base, engine
from app.models import Product
from app.services.nlp_service import extract_items_from_text
from app.services.fuzzy_service import validate_product_with_db

def run_quantity_parsing_tests():
    print("==================================================")
    print("RUNNING REDESIGNED VENDORGPT QUANTITY & MULTI-ITEM TEST SUITE")
    print("==================================================")

    db = SessionLocal()
    try:
        # Ensure initial database seed items exist for testing
        test_products = [
            {"product_name": "Sugar", "telugu_name": "చక్కెర", "category": "Groceries", "unit": "kg", "selling_price": 45.0},
            {"product_name": "Rice", "telugu_name": "బియ్యం", "category": "Grains", "unit": "kg", "selling_price": 60.0},
            {"product_name": "Toor Dal", "telugu_name": "కందిపప్పు", "category": "Pulses", "unit": "kg", "selling_price": 160.0},
        ]
        for p_data in test_products:
            p_exist = db.query(Product).filter(Product.product_name == p_data["product_name"]).first()
            if not p_exist:
                p = Product(**p_data, active=True, stock_quantity=100.0)
                db.add(p)
        db.commit()

        # 1. Single Item Unit Tests (Requirement 5)
        single_item_tests = [
            {
                "input_text": "1/2 కేజీ బియ్యం",
                "expected_product": "Rice",
                "expected_qty": 0.5,
                "expected_unit": "kg"
            },
            {
                "input_text": "అరకేజీ చక్కెర",
                "expected_product": "Sugar",
                "expected_qty": 0.5,
                "expected_unit": "kg"
            },
            {
                "input_text": "పావు కిలో బియ్యం",
                "expected_product": "Rice",
                "expected_qty": 0.25,
                "expected_unit": "kg"
            },
            {
                "input_text": "ముక్కాలు కిలో పప్పు",
                "expected_product": "Toor Dal",
                "expected_qty": 0.75,
                "expected_unit": "kg"
            },
            {
                "input_text": "2 కేజీల బియ్యం",
                "expected_product": "Rice",
                "expected_qty": 2.0,
                "expected_unit": "kg"
            },
            {
                "input_text": "half kg sugar",
                "expected_product": "Sugar",
                "expected_qty": 0.5,
                "expected_unit": "kg"
            },
            {
                "input_text": "quarter kg rice",
                "expected_product": "Rice",
                "expected_qty": 0.25,
                "expected_unit": "kg"
            },
            {
                "input_text": "500 grams sugar",
                "expected_product": "Sugar",
                "expected_qty": 0.5,
                "expected_unit": "kg"
            },
            {
                "input_text": "చక్కెర",  # No quantity phrase specified -> default to 1 kg
                "expected_product": "Sugar",
                "expected_qty": 1.0,
                "expected_unit": "kg"
            }
        ]

        print("\n--- Phase 1: Single Item Quantity Tests ---")
        for tc in single_item_tests:
            text = tc["input_text"]
            exp_prod = tc["expected_product"]
            exp_qty = tc["expected_qty"]
            exp_unit = tc["expected_unit"]

            print(f"\nTesting: '{text}'")
            extracted = extract_items_from_text(text, db=db)
            print(f"[NLP EXTRACTED] {extracted}")
            assert len(extracted) >= 1, f"No items extracted for '{text}'"

            item = extracted[0]
            val = validate_product_with_db(item['raw_product'], item['quantity'], item['unit'], db)
            print(f"[CART ITEM] Product='{val['matched_product_name']}', Qty={val['quantity']}, Unit='{val['matched_unit']}'")

            assert val['status'] == 'confirmed', f"Validation failed for '{text}': Status is {val['status']}"
            assert val['matched_product_name'] == exp_prod, f"Expected '{exp_prod}', got '{val['matched_product_name']}'"
            assert val['quantity'] == exp_qty, f"Expected quantity {exp_qty}, got {val['quantity']}"
            assert val['matched_unit'] == exp_unit, f"Expected unit '{exp_unit}', got '{val['matched_unit']}'"
            print(f"✅ PASSED: '{text}' -> {val['matched_product_name']} x {val['quantity']} {val['matched_unit']}")

        # 2. Complete Multi-Product Sentence Tests (Requirement 6)
        print("\n--- Phase 2: Complete Sentence Multi-Product Tests ---")
        sentence_tests = [
            {
                "sentence": "అర కేజీ బియ్యం, ఒక కేజీ చక్కెర, రెండు కేజీల పప్పు",
                "expected_items": [
                    {"product": "Rice", "qty": 0.5, "unit": "kg"},
                    {"product": "Sugar", "qty": 1.0, "unit": "kg"},
                    {"product": "Toor Dal", "qty": 2.0, "unit": "kg"}
                ]
            },
            {
                "sentence": "అర కేజీ బియ్యం ఒక కేజీ చక్కెర రెండు కేజీల పప్పు",
                "expected_items": [
                    {"product": "Rice", "qty": 0.5, "unit": "kg"},
                    {"product": "Sugar", "qty": 1.0, "unit": "kg"},
                    {"product": "Toor Dal", "qty": 2.0, "unit": "kg"}
                ]
            },
            {
                "sentence": "1/2 కేజీ బియ్యం 1 కేజీ చక్కెర 2 కేజీల పప్పు",
                "expected_items": [
                    {"product": "Rice", "qty": 0.5, "unit": "kg"},
                    {"product": "Sugar", "qty": 1.0, "unit": "kg"},
                    {"product": "Toor Dal", "qty": 2.0, "unit": "kg"}
                ]
            }
        ]

        for st in sentence_tests:
            sentence = st["sentence"]
            expected_list = st["expected_items"]
            print(f"\nTesting Full Sentence: '{sentence}'")
            extracted = extract_items_from_text(sentence, db=db)
            print(f"[NLP EXTRACTED SENTENCE ITEMS] {extracted}")
            assert len(extracted) == len(expected_list), f"Expected {len(expected_list)} items, extracted {len(extracted)}"

            validated_cart = []
            for item in extracted:
                val = validate_product_with_db(item['raw_product'], item['quantity'], item['unit'], db)
                validated_cart.append({
                    "product": val['matched_product_name'],
                    "qty": val['quantity'],
                    "unit": val['matched_unit']
                })

            print(f"[BILLING CART RESULT] {validated_cart}")
            for idx, exp in enumerate(expected_list):
                act = validated_cart[idx]
                assert act["product"] == exp["product"], f"Item {idx}: Expected product {exp['product']}, got {act['product']}"
                assert act["qty"] == exp["qty"], f"Item {idx}: Expected qty {exp['qty']}, got {act['qty']}"
                assert act["unit"] == exp["unit"], f"Item {idx}: Expected unit {exp['unit']}, got {act['unit']}"

            print(f"✅ PASSED FULL SENTENCE: '{sentence}'")

        print("\n==================================================")
        print("🎉 ALL REDESIGNED QUANTITY & MULTI-PRODUCT TESTS PASSED PERFECTLY!")
        print("==================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_quantity_parsing_tests()
