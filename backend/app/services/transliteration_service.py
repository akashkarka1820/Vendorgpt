import re

# Comprehensive Kirana & Retail Product/Brand Dictionary for exact transliteration & Telugu equivalents
RETAIL_DICTIONARY = {
    # Common Kirana Items & Staples
    "chicken": "చికెన్",
    "masala": "మసాలా",
    "chicken masala": "చికెన్ మసాలా",
    "garam masala": "గరం మసాలా",
    "mutton masala": "మటన్ మసాలా",
    "biryani masala": "బిర్యానీ మసాలా",
    "fish masala": "ఫిష్ మసాలా",
    "boost": "బూస్ట్",
    "horlicks": "హార్లిక్స్",
    "bournvita": "బోర్న్ విటా",
    "complan": "కామ్ప్లాన్",
    "britannia": "బ్రిటానియా",
    "biscuits": "బిస్కెట్స్",
    "biscuit": "బిస్కెట్",
    "britannia biscuits": "బ్రిటానియా బిస్కెట్స్",
    "parle": "పార్లే",
    "parle g": "పార్లే జి",
    "good day": "గుడ్ డే",
    "oreo": "ఓరియో",
    "marie gold": "మారీ గోల్డ్",
    "5050": "5050",
    "rice": "బియ్యం",
    "basmati rice": "బాస్మతీ బియ్యం",
    "raw rice": "పచ్చి బియ్యం",
    "boiled rice": "ఉప్పుడు బియ్యం",
    "sugar": "చక్కెర",
    "milk": "పాలు",
    "curd": "పెరుగు",
    "butter": "బటర్",
    "ghee": "నెయ్యి",
    "paneer": "పన్నీర్",
    "oil": "ఆయిల్",
    "sunflower oil": "సన్ ఫ్లవర్ ఆయిల్",
    "groundnut oil": "వేరుశెనగ నూనె",
    "mustard oil": "ఆవ నూనె",
    "coconut oil": "కొబ్బరి నూనె",
    "dal": "పప్పు",
    "toor dal": "కంది పప్పు",
    "moong dal": "పెసర పప్పు",
    "urad dal": "మినప పప్పు",
    "chana dal": "శనగ పప్పు",
    "salt": "ఉప్పు",
    "turmeric": "పసుపు",
    "chilli": "చిల్లీ",
    "chilli powder": "కారం పొడి",
    "red chilli": "ఎర్ర మిరపకాయలు",
    "coriander": "ధనియాలు",
    "cumin": "జీలకర్ర",
    "mustard": "ఆవాలు",
    "tea": "టీ",
    "tea powder": "టీ పొడి",
    "coffee": "కాఫీ",
    "coffee powder": "కాఫీ పొడి",
    "soap": "సోప్",
    "shampoo": "షాంపు",
    "toothpaste": "టూత్ పేస్ట్",
    "paste": "పేస్ట్",
    "washing powder": "వాషింగ్ పౌడర్",
    "detergent": "డిటర్జెంట్",
    "surf excel": "సర్ఫ్ ఎక్సెల్",
    "rin": "రిన్",
    "tide": "టైడ్",
    "vim": "విమ్",
    "dettol": "డెట్టాల్",
    "colgate": "కోల్గేట్",
    "close up": "క్లోజ్ అప్",
    "pepsodent": "ペప్సోడెంట్",
    "lux": "లక్స్",
    "santoor": "సంతూర్",
    "doves": "డౌ",
    "lifebuoy": "లైఫ్‌బాయ్",
    "head and shoulders": "హెడ్ అండ్ షోల్డర్స్",
    "clinic plus": "క్లినిక్ ప్లస్",
    "pantene": "ప్యాంటీన్",
    "maggi": "మ్యాగీ",
    "maggi noodles": "మ్యాగీ నూడుల్స్",
    "yippee": "యిప్పీ",
    "pasta": "పాస్తా",
    "macaroni": "మెకరోనీ",
    "oats": "ఓట్స్",
    "corn flakes": "కార్న్ ఫ్లేక్స్",
    "bread": "బ్రెడ్",
    "jam": "జామ్",
    "ketchup": "కెచప్",
    "sauce": "సాస్",
    "pickle": "ఊరగాయ",
    "mango pickle": "మామిడికాయ ఊరగాయ",
    "lemon pickle": "నిమ్మకాయ ఊరగాయ",
    "papadam": "అప్పడాలు",
    "papad": "అప్పడాలు",
    "matchbox": "అగ్గిపెట్టె",
    "candle": "వ్వొత్తి"
}

# Phonetic Rules for converting any English string to Telugu phonetically
PHONETIC_PATTERNS = [
    (r'ch', 'చ్'), (r'sh', 'ష్'), (r'th', 'త్'), (r'ph', 'ఫ్'), (r'ck', 'క్'), (r'gh', 'ఘ్'),
    (r'ee', 'ీ'), (r'oo', 'ూ'), (r'ai', 'ై'), (r'au', 'ౌ'), (r'ou', 'ౌ'), (r'ea', 'ీ'),
    (r'a', 'ా'), (r'b', 'బ్'), (r'c', 'క్'), (r'd', 'డ్'), (r'e', 'ె'), (r'f', 'ఫ్'),
    (r'g', 'గ్'), (r'h', 'హ్'), (r'i', 'ి'), (r'j', 'జ్'), (r'k', 'క్'), (r'l', 'ల్'),
    (r'm', 'మ్'), (r'n', 'న్'), (r'o', 'ో'), (r'p', 'ప్'), (r'q', 'క్'), (r'r', 'ర్'),
    (r's', 'స్'), (r't', 'ట్'), (r'u', 'ు'), (r'v', 'వ్'), (r'w', 'వ్'), (r'x', 'క్స్'),
    (r'y', 'య్'), (r'z', 'జ్')
]

def transliterate_single_word(word: str) -> str:
    w_clean = word.lower().strip()
    if not w_clean:
        return ""

    if w_clean in RETAIL_DICTIONARY:
        return RETAIL_DICTIONARY[w_clean]

    res = w_clean
    for eng, tel in PHONETIC_PATTERNS:
        res = re.sub(eng, tel, res)
    return res

def transliterate_to_telugu(text: str) -> str:
    """
    Transliterates English product & brand names to Telugu script.
    Checks exact retail dictionary matches first, then falls back to phonetic rule mapping.
    Examples:
      'Chicken Masala' -> 'చికెన్ మసాలా'
      'Boost' -> 'బూస్ట్'
      'Horlicks' -> 'హార్లిక్స్'
      'Britannia Biscuits' -> 'బ్రిటానియా బిస్కెట్స్'
    """
    if not text or not text.strip():
        return ""

    clean_text = text.strip().lower()
    
    # 1. Direct full string lookup
    if clean_text in RETAIL_DICTIONARY:
        return RETAIL_DICTIONARY[clean_text]

    # 2. Word by word transliteration
    words = clean_text.split()
    translated_words = []
    for w in words:
        if w in RETAIL_DICTIONARY:
            translated_words.append(RETAIL_DICTIONARY[w])
        else:
            translated_words.append(transliterate_single_word(w))

    return " ".join(translated_words)

# Reverse Mapping Dictionary (Telugu -> English representation)
REVERSE_DICTIONARY = {v.strip(): k.title() for k, v in RETAIL_DICTIONARY.items()}

def reverse_transliterate_telugu(telugu_text: str) -> str:
    """
    Converts Telugu product names to English/transliterated searchable names.
    Examples:
      'చికెన్ మసాలా' -> 'Chicken Masala'
      'బూస్ట్' -> 'Boost'
      'హార్లిక్స్' -> 'Horlicks'
      'బ్రిటానియా బిస్కెట్స్' -> 'Britannia Biscuits'
    If uncertain, preserves the original Telugu name cleanly rather than inventing a bad translation.
    """
    if not telugu_text or not telugu_text.strip():
        return ""
    
    clean_text = telugu_text.strip()
    
    # 1. Full string match
    if clean_text in REVERSE_DICTIONARY:
        return REVERSE_DICTIONARY[clean_text]
        
    # 2. Word by word lookup
    words = clean_text.split()
    eng_words = []
    matched_any = False
    for w in words:
        if w in REVERSE_DICTIONARY:
            eng_words.append(REVERSE_DICTIONARY[w])
            matched_any = True
        else:
            eng_words.append(w)
            
    if matched_any:
        return " ".join(eng_words)
        
    # Fallback to clean original Telugu text as authoritative name
    return clean_text
