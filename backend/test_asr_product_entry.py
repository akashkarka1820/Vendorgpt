import io
import wave
import struct
import math
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base, SessionLocal
from app.models import Product
from app.schemas import ProductCreate, ValidateItemRequest
from app.routes.products import create_product, validate_products
from app.services.transliteration_service import transliterate_to_telugu, reverse_transliterate_telugu

client = TestClient(app)

def generate_dummy_wav_bytes(duration_sec=1.0, sample_rate=16000, freq=440.0):
    num_samples = int(sample_rate * duration_sec)
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        for i in range(num_samples):
            t = i / sample_rate
            sample = int(32767.0 * 0.5 * math.sin(2.0 * math.pi * freq * t))
            wav_file.writeframes(struct.pack('<h', sample))
    return buf.getvalue()

def test_asr_endpoint_and_product_flow():
    print("\n=== Testing ASR Audio Endpoint and Add Product Flow ===")
    
    # 1. Test POST /api/voice/transcribe with wav audio
    dummy_wav = generate_dummy_wav_bytes(duration_sec=1.0)
    files = {"file": ("test_recording.wav", dummy_wav, "audio/wav")}
    data = {"language": "te"}

    print("[ADD PRODUCT VOICE] Sending dummy audio to /api/voice/transcribe...")
    res = client.post("/api/voice/transcribe", files=files, data=data)
    print(f"[ADD PRODUCT VOICE] Status Code: {res.status_code}")
    print(f"[ADD PRODUCT VOICE] Response: {res.json()}")

    assert res.status_code == 200
    json_resp = res.json()
    assert "transcription" in json_resp

    # 2. Test Reverse Transliteration for Telugu Inputs
    telugu_tests = [("చికెన్ మసాలా", "Chicken Masala"), ("బూస్ట్", "Boost")]
    for telugu_speech, expected_english in telugu_tests:
        eng_alias = reverse_transliterate_telugu(telugu_speech)
        print(f"\n[TELUGU VOICE TEST] Input Telugu: '{telugu_speech}' -> English Alias: '{eng_alias}'")
        assert eng_alias == expected_english, f"Expected {expected_english}, got {eng_alias}"

    # 3. Test Transliteration for English Inputs
    english_tests = [("Chicken Masala", "చికెన్ మసాలా"), ("Boost", "బూస్ట్")]
    for english_speech, expected_telugu in english_tests:
        telugu_alias = transliterate_to_telugu(english_speech)
        print(f"[ENGLISH VOICE TEST] Input English: '{english_speech}' -> Telugu Alias: '{telugu_alias}'")
        assert telugu_alias == expected_telugu, f"Expected {expected_telugu}, got {telugu_alias}"

    # 4. End-to-End Database Save & Voice Billing Test
    db = SessionLocal()
    try:
        # Clean up any existing test products
        for op in db.query(Product).filter(Product.product_name.ilike("%Chicken Masala%")).all():
            op.active = False
        db.commit()

        # Create product with Telugu input
        payload = ProductCreate(
            product_name=None,
            telugu_name="చికెన్ మసాలా",
            category="Spices",
            unit="packet",
            selling_price=60.0,
            stock_quantity=50.0
        )
        product = create_product(payload=payload, db=db)
        print(f"\n[DB SAVE SUCCESS] Created Product ID: {product.id}")
        print(f"   English Name: '{product.product_name}'")
        print(f"   Telugu Name: '{product.telugu_name}'")

        # Voice Billing match test with extracted product name
        billing_req = ValidateItemRequest(raw_product="చికెన్ మసాలా", quantity=2.0, unit="packet")
        billing_res = validate_products(items=[billing_req], db=db)
        match = billing_res.items[0]
        print(f"\n[VOICE BILLING MATCH TEST]")
        print(f"   Status: {match.status}, Matched Product Name: '{match.matched_product_name}', Confidence: {match.confidence}%")
        assert match.status == "confirmed"
        assert match.matched_product_id == product.id

        print("\nALL ASR & MULTILINGUAL PRODUCT ENTRY TESTS PASSED SUCCESSFULLY!")

    finally:
        db.close()

if __name__ == "__main__":
    test_asr_endpoint_and_product_flow()
