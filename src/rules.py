import re

def score(text: str) -> dict:
    """
    Returns a dict of named signal scores each 0-1,
    plus a `total` score capped at 1.0.
    Signals: urgency, authority, secrecy, shortlink, upi_ask, threat
    """
    text = text.lower()
    
    # 1. urgency
    urgency_keywords = ["urgent", "immediate", "suspend", "block", "within 24 hours", "action required", "act now", "expires", "immediately", "right now", "before it's too late", "last chance", "abhi", "turant", "jaldi", "final warning", "failure to comply", "or else"]
    urgency_score = 1.0 if any(kw in text for kw in urgency_keywords) else 0.0
    
    # 2. authority
    authority_keywords = ["police", "cbi", "customs", "trai", "rbi", "income tax", "supreme court", "arrest", "warrant", "fir", "reserve bank", "narcotics", "enforcement directorate", "ed", "cyber cell", "court", "gerftaar", "girftar", "case against you", "case filed", "legal action", "summon", "officer", "department"]
    authority_score = 1.0 if any(kw in text for kw in authority_keywords) else 0.0
    
    # 3. secrecy
    secrecy_keywords = ["do not tell", "secret", "confidential", "don't share", "alone", "isolated", "don't tell anyone", "keep this confidential", "don't share this", "kisi ko mat batana", "between us", "don't inform your family", "confidential matter", "don't disclose"]
    secrecy_score = 1.0 if any(kw in text for kw in secrecy_keywords) else 0.0
    
    # 4. shortlink
    shortlink_pattern = r"(bit\.ly|t\.co|tinyurl\.com|is\.gd|goo\.gl|wa\.me|sms:|http://[^\s]{1,15}$)"
    shortlink_score = 1.0 if re.search(shortlink_pattern, text) else 0.0
    
    # 5. upi_ask
    upi_keywords = ["upi pin", "enter pin", "scan qr", "send money", "refund", "pay now", "click to receive"]
    upi_score = 1.0 if any(kw in text for kw in upi_keywords) else 0.0
    
    # 6. threat
    threat_keywords = ["face arrest", "will be arrested", "legal consequences", "account will be blocked", "account will be frozen", "seized", "penalty", "fine", "jail", "will be seized", "will be blocked", "consequences", "arrest", "threaten", "demands money"]
    threat_score = 1.0 if any(kw in text for kw in threat_keywords) else 0.0
    
    # Calculate total
    weights = {
        'urgency': 0.15,
        'authority': 0.3,
        'secrecy': 0.2,
        'shortlink': 0.2,
        'upi_ask': 0.3,
        'threat': 0.15
    }
    
    total = (
        urgency_score * weights['urgency'] +
        authority_score * weights['authority'] +
        secrecy_score * weights['secrecy'] +
        shortlink_score * weights['shortlink'] +
        upi_score * weights['upi_ask'] +
        threat_score * weights['threat']
    )
    
    return {
        "urgency": urgency_score,
        "authority": authority_score,
        "secrecy": secrecy_score,
        "shortlink": shortlink_score,
        "upi_ask": upi_score,
        "threat": threat_score,
        "total": min(1.0, total)
    }
