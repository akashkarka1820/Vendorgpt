import re
from typing import List, Dict, Any

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Product


TELUGU_NUMBERS = {
    "ఒకటి": 1.0,
    "ఒక": 1.0,
    "ఒక్క": 1.0,
    "రెండు": 2.0,
    "రెండూ": 2.0,
    "మూడు": 3.0,
    "నాలుగు": 4.0,
    "ఐదు": 5.0,
    "ఆరు": 6.0,
    "ఏడు": 7.0,
    "ఎనిమిది": 8.0,
    "తొమ్మిది": 9.0,
    "పది": 10.0,
    "పదిహేను": 15.0,
    "ఇరవై": 20.0,
    "యాభై": 50.0,
    "అర": 0.5,
    "సగం": 0.5,
    "పావు": 0.25,
    "ముప్పావు": 0.75,
    "ముక్కాలు": 0.75
}


ENGLISH_NUMBERS = {
    "one": 1.0,
    "two": 2.0,
    "three": 3.0,
    "four": 4.0,
    "five": 5.0,
    "six": 6.0,
    "seven": 7.0,
    "eight": 8.0,
    "nine": 9.0,
    "ten": 10.0,
    "eleven": 11.0,
    "twelve": 12.0,
    "fifteen": 15.0,
    "twenty": 20.0,
    "fifty": 50.0,
    "half": 0.5,
    "quarter": 0.25
}


UNIT_MAPPINGS = {
    # English
    "kg": "kg",
    "kgs": "kg",
    "kilo": "kg",
    "kilos": "kg",
    "kilogram": "kg",
    "kilograms": "kg",

    "g": "g",
    "gm": "g",
    "gms": "g",
    "gram": "g",
    "grams": "g",

    "packet": "packet",
    "packets": "packet",
    "pkt": "packet",
    "pkts": "packet",
    "pack": "packet",
    "packs": "packet",

    "litre": "liter",
    "litres": "liter",
    "liter": "liter",
    "liters": "liter",
    "l": "liter",
    "ltr": "liter",

    "piece": "piece",
    "pieces": "piece",
    "pc": "piece",
    "pcs": "piece",
    "bottle": "piece",
    "bottles": "piece",
    "can": "piece",
    "cans": "piece",
    "tin": "piece",
    "tins": "piece",
    "bag": "piece",
    "bags": "piece",

    # Telugu
    "కిలో": "kg",
    "కిలోలు": "kg",
    "కిలోల": "kg",
    "కేజీ": "kg",
    "కేజీలు": "kg",

    "గ్రామ్స్": "g",
    "గ్రాములు": "g",
    "గ్రాముల": "g",
    "గ్రాం": "g",

    "ప్యాకెట్": "packet",
    "ప్యాకెట్లు": "packet",
    "ప్యాకెట్ల": "packet",
    "పాకెట్": "packet",
    "పాకెట్లు": "packet",

    "లీటర్": "liter",
    "లీటర్లు": "liter",
    "లీటర్ల": "liter",

    "బాటిల్": "piece",
    "బాటిళ్ళు": "piece",
    "ముక్కలు": "piece"
}


FILLER_WORDS = [
    # English
    "add",
    "give",
    "me",
    "and",
    "please",
    "plus",
    "also",
    "with",
    "want",
    "need",
    "take",

    # Telugu
    "ఇవ్వండి",
    "ఇవ్వు",
    "మరియు",
    "కూడా",
    "కావాలి",
    "వేయు",
    "తీసుకో",
    "తీసుకోండి",
    "రాసుకో",
    "రాసుకోండి"
]


WB_START = r'(?<![\w\u0C00-\u0C7F])'
WB_END = r'(?![\w\u0C00-\u0C7F])'


# Order matters:
# Longer / more specific phrases and fractions
# must be evaluated before shorter ones.
QUANTITY_EXPRESSIONS = [

    # -----------------------------------------------------
    # 1. Explicit Fraction Expressions
    # -----------------------------------------------------

    (
        f'{WB_START}1\/2\s*(కిలోలు|కిలోల|కిలో|కేజీలు|కేజీ|kilos|kgs|kilo|kg|kilograms|kilogram)ల?{WB_END}',
        0.5,
        "kg"
    ),

    (
        f'{WB_START}1\/2(కిలో|కేజీ)ల?{WB_END}',
        0.5,
        "kg"
    ),

    (
        f'{WB_START}1\/4\s*(కిలోలు|కిలోల|కిలో|కేజీలు|కేజీ|kilos|kgs|kilo|kg|kilograms|kilogram)ల?{WB_END}',
        0.25,
        "kg"
    ),

    (
        f'{WB_START}1\/4(కిలో|కేజీ)ల?{WB_END}',
        0.25,
        "kg"
    ),

    (
        f'{WB_START}3\/4\s*(కిలోలు|కిలోల|కిలో|కేజీలు|కేజీ|kilos|kgs|kilo|kg|kilograms|kilogram)ల?{WB_END}',
        0.75,
        "kg"
    ),

    (
        f'{WB_START}3\/4(కిలో|కేజీ)ల?{WB_END}',
        0.75,
        "kg"
    ),

    (
        f'{WB_START}1\/2{WB_END}',
        0.5,
        "kg"
    ),

    (
        f'{WB_START}1\/4{WB_END}',
        0.25,
        "kg"
    ),

    (
        f'{WB_START}3\/4{WB_END}',
        0.75,
        "kg"
    ),

    # Generic fraction matcher
    (
        f'{WB_START}(\d+)\/(\d+)\s*(కిలోలు|కిలోల|కిలో|కేజీలు|కేజీ|kilos|kgs|kilo|kg|kilograms|kilogram)?ల?{WB_END}',
        "FRACTION",
        "kg"
    ),

    # -----------------------------------------------------
    # 2. Telugu Compound / Phrase Quantity Words
    # -----------------------------------------------------

    (
        f'{WB_START}(అర|సగం)\s*(కిలో|కేజీ|kilo|kg|kilogram)ల?{WB_END}',
        0.5,
        "kg"
    ),

    (
        f'{WB_START}అర(కిలో|కేజీ)ల?{WB_END}',
        0.5,
        "kg"
    ),

    (
        f'{WB_START}(పావు)\s*(కిలో|కేజీ|kilo|kg|kilogram)ల?{WB_END}',
        0.25,
        "kg"
    ),

    (
        f'{WB_START}పావు(కిలో|కేజీ)ల?{WB_END}',
        0.25,
        "kg"
    ),

    (
        f'{WB_START}(ముక్కాలు|ముప్పావు)\s*(కిలో|కేజీ|kilo|kg|kilogram)ల?{WB_END}',
        0.75,
        "kg"
    ),

    (
        f'{WB_START}(ముక్కాలు|ముప్పావు)(కిలో|కేజీ)ల?{WB_END}',
        0.75,
        "kg"
    ),

    (
        f'{WB_START}మూడు\s+పావులు?{WB_END}',
        0.75,
        "kg"
    ),

    (
        f'{WB_START}(ఒక|ఒక్క|ఒకటి)\s*(కిలోలు|కిలోల|కిలో|కేజీలు|కేజీ|kilos|kgs|kilo|kg)ల?{WB_END}',
        1.0,
        "kg"
    ),

    (
        f'{WB_START}(ఒక|ఒక్క)(కిలోలు|కిలోల|కిలో|కేజీలు|కేజీ)ల?{WB_END}',
        1.0,
        "kg"
    ),

    (
        f'{WB_START}(రెండు|రెండూ)\s*(కిలోలు|కిలోల|కిలో|కేజీలు|కేజీ|kilos|kgs|kilo|kg)ల?{WB_END}',
        2.0,
        "kg"
    ),

    (
        f'{WB_START}రెండు(కిలోలు|కిలోల|కిలో|కేజీలు|కేజీ)ల?{WB_END}',
        2.0,
        "kg"
    ),

    # -----------------------------------------------------
    # 3. English Quantity Phrases
    # -----------------------------------------------------

    (
        f'{WB_START}half\s+(a\s+)?(kg|kilo|kilogram)s?{WB_END}',
        0.5,
        "kg"
    ),

    (
        f'{WB_START}quarter\s+(a\s+)?(kg|kilo|kilogram)s?{WB_END}',
        0.25,
        "kg"
    ),

    (
        f'{WB_START}(three\s+quarters?|3/4)\s+(kg|kilo|kilogram)s?{WB_END}',
        0.75,
        "kg"
    ),

    # -----------------------------------------------------
    # 4. Gram Conversions to KG
    # -----------------------------------------------------

    (
        f'{WB_START}500\s*(grams?|gm|gms|g|గ్రాములు|గ్రామ్స్|గ్రాం){WB_END}',
        0.5,
        "kg"
    ),

    (
        f'{WB_START}250\s*(grams?|gm|gms|g|గ్రాములు|గ్రామ్స్|గ్రాం){WB_END}',
        0.25,
        "kg"
    ),

    (
        f'{WB_START}750\s*(grams?|gm|gms|g|గ్రాములు|గ్రామ్స్|గ్రాం){WB_END}',
        0.75,
        "kg"
    ),

    (
        f'{WB_START}100\s*(grams?|gm|gms|g|గ్రాములు|గ్రామ్స్|గ్రాం){WB_END}',
        0.1,
        "kg"
    ),

    (
        f'{WB_START}200\s*(grams?|gm|gms|g|గ్రాములు|గ్రామ్స్|గ్రాం){WB_END}',
        0.2,
        "kg"
    ),

    # -----------------------------------------------------
    # 5. Explicit Numeric Values + KG
    # -----------------------------------------------------

    (
        f'{WB_START}(\d+(?:\.\d+)?)\s*(కిలోలు|కిలోల|కిలో|కేజీలు|కేజీ|kilos|kgs|kilo|kg|kilograms|kilogram)ల?{WB_END}',
        "NUMERIC",
        "kg"
    ),

    (
        f'{WB_START}0\.5\s*(kg|kilo|kilogram|kgs|kilos)?{WB_END}',
        0.5,
        "kg"
    ),

    (
        f'{WB_START}0\.25\s*(kg|kilo|kilogram|kgs|kilos)?{WB_END}',
        0.25,
        "kg"
    ),

    (
        f'{WB_START}0\.75\s*(kg|kilo|kilogram|kgs|kilos)?{WB_END}',
        0.75,
        "kg"
    ),
]


def normalize_text(text: str) -> str:
    text = text.lower()

    text = re.sub(
        r'\bపాల\b',
        'పాలు',
        text
    )

    # Preserve forward slash for fractions such as 1/2.
    text = re.sub(
        r'[^\w\s,\.\/\u0C00-\u0C7F]',
        ' ',
        text
    )

    return text.strip()


def parse_number(token: str) -> float | None:

    try:
        return float(token)

    except ValueError:
        pass

    token_lower = token.lower()

    if token_lower in TELUGU_NUMBERS:
        return TELUGU_NUMBERS[token_lower]

    if token_lower in ENGLISH_NUMBERS:
        return ENGLISH_NUMBERS[token_lower]

    return None


def normalize_unit(token: str) -> str | None:

    token_lower = token.lower()

    return UNIT_MAPPINGS.get(
        token_lower,
        None
    )


def parse_quantity_and_unit(segment: str):

    """
    Decouples quantity & unit parsing from product matching.

    Parses fractions such as:
        1/2 -> 0.5
        1/4 -> 0.25
        3/4 -> 0.75

    Quantity parsing order:

    1. Explicit quantity phrases and fractions
    2. Number words + unit words
    3. Numeric digits + unit words
    4. Default quantity = 1.0

    Returns:

        quantity,
        unit,
        clean_product_text
    """

    clean_seg = segment.strip()

    extracted_qty = None
    extracted_unit = None

    # -----------------------------------------------------
    # 1. Match explicit quantity phrases
    # -----------------------------------------------------

    for pattern, qty_val, unit_val in QUANTITY_EXPRESSIONS:

        match = re.search(
            pattern,
            clean_seg,
            flags=re.IGNORECASE
        )

        if match:

            if qty_val == "FRACTION":

                num = float(
                    match.group(1)
                )

                den = float(
                    match.group(2)
                )

                extracted_qty = (
                    num / den
                    if den != 0
                    else 1.0
                )

            elif qty_val == "NUMERIC":

                extracted_qty = float(
                    match.group(1)
                )

            else:

                extracted_qty = qty_val

            extracted_unit = unit_val

            clean_seg = re.sub(
                pattern,
                " ",
                clean_seg,
                flags=re.IGNORECASE
            ).strip()

            break

    # -----------------------------------------------------
    # 2. Inspect leftover tokens
    # -----------------------------------------------------

    words = clean_seg.split()

    rem_words = []

    for word in words:

        w_lower = word.lower()

        if w_lower in FILLER_WORDS:
            continue

        num = parse_number(word)

        norm_u = normalize_unit(word)

        if num is not None and extracted_qty is None:

            extracted_qty = num

            continue

        if norm_u is not None and extracted_unit is None:

            extracted_unit = norm_u

            continue

        rem_words.append(word)

    clean_product_text = " ".join(
        rem_words
    ).strip()

    # -----------------------------------------------------
    # 3. Default quantity
    # -----------------------------------------------------

    if extracted_qty is None:
        extracted_qty = 1.0

    return (
        extracted_qty,
        extracted_unit,
        clean_product_text
    )


def get_active_products_from_db(
    db: Session = None,
    user_id: int | None = None
):

    """
    Loads active products dynamically from the database.

    IMPORTANT:
    When user_id is supplied, only products belonging
    to that logged-in vendor are returned.
    """

    close_needed = False

    if db is None:

        db = SessionLocal()

        close_needed = True

    try:

        query = db.query(Product).filter(
            Product.active == True
        )

        # -------------------------------------------------
        # Vendor-specific product filtering
        # -------------------------------------------------

        if user_id is not None:

            query = query.filter(
                Product.user_id == user_id
            )

        products = query.all()

        return products

    finally:

        if close_needed:
            db.close()


def extract_items_from_text(
    text: str,
    language: str = "auto",
    db: Session = None,
    user_id: int | None = None
) -> List[Dict[str, Any]]:

    """
    Extracts structured list of items:

        product
        quantity
        unit

    from spoken Telugu or English billing text.

    Product matching uses only products belonging
    to the current vendor when user_id is supplied.
    """

    cleaned = normalize_text(text)

    if not cleaned:

        print(
            "[NLP] Empty text provided"
        )

        return []

    print(
        f"[NLP] Normalized transcription: {cleaned}"
    )

    # -----------------------------------------------------
    # Load vendor-specific products
    # -----------------------------------------------------

    active_products = get_active_products_from_db(
        db=db,
        user_id=user_id
    )

    # -----------------------------------------------------
    # Insert delimiters before quantity phrases
    # -----------------------------------------------------

    quantity_delimiters = (
        WB_START
        + r'(?:1\/2|1\/4|3\/4|\d+\/\d+|అర|సగం|పావు|'
          r'ముక్కాలు|ముప్పావు|ఒక|ఒక్క|ఒకటి|రెండు|రెండూ|'
          r'మూడు|నాలుగు|ఐదు|half|quarter|500|250|750|'
          r'\d+(?:\.\d+)?)'
        + WB_END
    )

    segmented_str = re.sub(
        r'([^\s,]+)\s+('
        + quantity_delimiters
        + r')',
        r'\1, \2',
        cleaned,
        flags=re.IGNORECASE
    )

    raw_segments = re.split(
        r',|\band\b|\bమరియు\b|\bకూడా\b',
        segmented_str
    )

    extracted_items = []

    # -----------------------------------------------------
    # Process each segment
    # -----------------------------------------------------

    for seg in raw_segments:

        seg = seg.strip()

        if not seg:
            continue

        qty, unit, raw_product = (
            parse_quantity_and_unit(seg)
        )

        # -------------------------------------------------
        # Ignore phrases without product name
        # -------------------------------------------------

        if not raw_product:

            print(
                "[NLP] Ignoring phrase with no "
                f"product name token: '{seg}'"
            )

            continue

        # -------------------------------------------------
        # Match product against current vendor's DB
        # -------------------------------------------------

        raw_clean = raw_product.lower()

        matched_db_product = None

        for product in active_products:

            product_en = (
                product.product_name or ""
            ).strip().lower()

            product_te = (
                product.telugu_name or ""
            ).strip().lower()

            if (
                product_en
                and (
                    product_en == raw_clean
                    or product_en in raw_clean
                    or raw_clean in product_en
                )
            ) or (
                product_te
                and (
                    product_te == raw_clean
                    or product_te in raw_clean
                    or raw_clean in product_te
                )
            ):

                matched_db_product = product

                break

        # -------------------------------------------------
        # Determine final product/unit
        # -------------------------------------------------

        final_product_name = (
            matched_db_product.product_name
            if matched_db_product
            else raw_product
        )

        final_unit = (
            unit
            or (
                matched_db_product.unit
                if matched_db_product
                else "kg"
            )
        )

        # -------------------------------------------------
        # Create extracted item
        # -------------------------------------------------

        item_dict = {
            "raw_product": final_product_name,
            "normalized_product": final_product_name,
            "quantity": qty,
            "unit": final_unit
        }

        print(
            "[NLP] extracted items: "
            f"product='{final_product_name}' "
            f"(raw='{raw_product}'), "
            f"qty={qty}, "
            f"unit='{final_unit}'"
        )

        extracted_items.append(
            item_dict
        )

    return extracted_items