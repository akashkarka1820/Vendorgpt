from typing import List, Dict, Any
from sqlalchemy.orm import Session
from rapidfuzz import process, fuzz
from app.models import Product

# Named confidence threshold constants
FUZZY_AUTO_ACCEPT_THRESHOLD = 70.0
FUZZY_CONFIRM_THRESHOLD = 50.0

def validate_product_with_db(
    raw_product: str,
    quantity: float,
    unit: str,
    db: Session
) -> Dict[str, Any]:
    """
    Validates a product against the database using exact matching and RapidFuzz fuzzy matching.
    Database is the SINGLE SOURCE OF TRUTH.
    """
    active_products = db.query(Product).filter(Product.active == True).all()
    print(f"[PRODUCTS] Active database products loaded: {len(active_products)}")

    if not active_products:
        print(f"[MATCH] No active products in DB for raw product '{raw_product}'")
        return {
            "raw_product": raw_product,
            "quantity": quantity,
            "unit": unit,
            "confidence": 0.0,
            "status": "not_found",
            "suggested_products": []
        }

    raw_clean = raw_product.strip().lower()

    # 1. CASE A: Exact match check (English name or Telugu name)
    for p in active_products:
        p_en = (p.product_name or "").strip().lower()
        p_te = (p.telugu_name or "").strip().lower()

        if (p_en and p_en == raw_clean) or (p_te and p_te == raw_clean):
            print(f"[MATCH] Exact match found! Product '{p.product_name}' (ID: {p.id}), Confidence: 100.0, Status: confirmed")
            return {
                "raw_product": raw_product,
                "quantity": quantity,
                "unit": p.unit or unit,
                "matched_product_id": p.id,
                "matched_product_name": p.product_name,
                "matched_telugu_name": p.telugu_name,
                "matched_unit": p.unit,
                "matched_price": p.selling_price,
                "matched_gst_percentage": p.gst_percentage,
                "confidence": 100.0,
                "status": "confirmed",
                "suggested_products": []
            }

    # 2. Map dict for RapidFuzz (lower-cased for maximum score accuracy)
    candidate_map = {}
    choices_dict = {}
    for p in active_products:
        if p.product_name:
            k_en = f"p_{p.id}_en"
            candidate_map[k_en] = p
            choices_dict[k_en] = p.product_name.strip().lower()

        if p.telugu_name:
            k_te = f"p_{p.id}_te"
            candidate_map[k_te] = p
            choices_dict[k_te] = p.telugu_name.strip().lower()

    matches = process.extract(
        raw_clean,
        choices_dict,
        scorer=fuzz.ratio,
        limit=5
    )

    if not matches:
        print(f"[MATCH] No RapidFuzz matches found for '{raw_product}'")
        return {
            "raw_product": raw_product,
            "quantity": quantity,
            "unit": unit,
            "confidence": 0.0,
            "status": "not_found",
            "suggested_products": [
                {
                    "id": p.id,
                    "product_name": p.product_name,
                    "telugu_name": p.telugu_name,
                    "selling_price": p.selling_price,
                    "unit": p.unit
                } for p in active_products[:5]
            ]
        }

    first_val, top_score, top_key = matches[0]
    best_product = candidate_map[top_key]

    suggestions = []
    seen_ids = set()
    for val, score, key in matches:
        p = candidate_map[key]
        if p.id not in seen_ids:
            seen_ids.add(p.id)
            suggestions.append({
                "id": p.id,
                "product_name": p.product_name,
                "telugu_name": p.telugu_name,
                "selling_price": p.selling_price,
                "unit": p.unit,
                "score": round(score, 1)
            })

    # Threshold evaluation
    if top_score >= FUZZY_AUTO_ACCEPT_THRESHOLD:
        status = "confirmed"
    elif top_score >= FUZZY_CONFIRM_THRESHOLD:
        status = "suggestion"
    else:
        status = "not_found"

    print(f"[MATCH] Top candidate: '{best_product.product_name}' (ID: {best_product.id}), Score: {top_score:.1f}, Status: {status}")

    return {
        "raw_product": raw_product,
        "quantity": quantity,
        "unit": best_product.unit or unit,
        "matched_product_id": best_product.id if status != "not_found" else None,
        "matched_product_name": best_product.product_name if status != "not_found" else None,
        "matched_telugu_name": best_product.telugu_name if status != "not_found" else None,
        "matched_unit": best_product.unit if status != "not_found" else None,
        "matched_price": best_product.selling_price if status != "not_found" else None,
        "matched_gst_percentage": best_product.gst_percentage if status != "not_found" else None,
        "confidence": round(top_score, 1),
        "status": status,
        "suggested_products": suggestions
    }
