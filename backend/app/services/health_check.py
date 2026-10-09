import re
from datetime import date, datetime
from difflib import SequenceMatcher
from itertools import combinations

from app.models import Application, Document


HONORIFICS = ['shri', 'smt', 'srimathi', 'thiru', 'selvi', 'dr', 'mr', 'mrs', 'ms', 'kumari', 'late']


def normalize_name(name: str | None) -> str | None:
    if not name:
        return None
    clean = re.sub(r"[^\w\s]", " ", name.lower(), flags=re.UNICODE)
    clean = re.sub(r"\s+", " ", clean).strip()
    tokens = [t for t in clean.split(' ') if t and t not in HONORIFICS]
    return " ".join(sorted(tokens)) or None


def _is_initial_match(first: list[str], second: list[str]) -> bool:
    if not first or not second:
        return False
    # Check if single letter matches starting of word in other
    single_letter_first = [t for t in first if len(t) == 1]
    words_second = [t for t in second if len(t) > 1]
    for init in single_letter_first:
        if any(w.startswith(init) for w in words_second):
            return True
            
    single_letter_second = [t for t in second if len(t) == 1]
    words_first = [t for t in first if len(t) > 1]
    for init in single_letter_second:
        if any(w.startswith(init) for w in words_first):
            return True
            
    return False


def compare_names(value_a: str | None, value_b: str | None) -> str:
    a, b = normalize_name(value_a), normalize_name(value_b)
    if not a or not b or "unknown" in {a, b}:
        return "UNKNOWN"
    if a == b:
        return "MATCH"
        
    tokens_a = a.split()
    tokens_b = b.split()
    shared = [t for t in tokens_a if t in tokens_b]
    max_tokens = max(len(tokens_a), len(tokens_b))
    
    if len(shared) == max_tokens:
        return "MATCH"
        
    initials_match = _is_initial_match(tokens_a, tokens_b)
    
    if len(shared) >= 1 and (initials_match or len(shared) >= max_tokens - 1):
        return "MINOR_MISMATCH"
        
    return "MAJOR_MISMATCH"


def normalize_date(date_str: str | None) -> str | None:
    if not date_str:
        return None
    clean = date_str.strip()
    iso_match = re.match(r"^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$", clean)
    if iso_match:
        return iso_match.group(1)
    ind_match = re.match(r"^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$", clean)
    if ind_match:
        return ind_match.group(3)
    year_match = re.search(r"\b(19\d{2}|20\d{2})\b", clean)
    if year_match:
        return year_match.group(1)
    return clean


def compare_dates(value_a: str | None, value_b: str | None) -> str:
    year_a = normalize_date(value_a)
    year_b = normalize_date(value_b)
    if not year_a or not year_b or "unknown" in {year_a.lower(), year_b.lower()}:
        return "UNKNOWN"
    if year_a == year_b:
        return "MATCH"
    return "MAJOR_MISMATCH"


def normalize_text(value: str | None) -> str | None:
    if not value:
        return None
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", value.lower())).strip() or None


def compare_values(value_a: str | None, value_b: str | None, field: str) -> str:
    if not value_a or not value_b or "unknown" in {str(value_a).lower(), str(value_b).lower()}:
        return "UNKNOWN"
    if field == "name":
        return compare_names(value_a, value_b)
    if field == "date_of_birth":
        return compare_dates(value_a, value_b)
    if field in ("address", "state", "district"):
        a, b = normalize_text(str(value_a)), normalize_text(str(value_b))
        if a and b and (a in b or b in a):
            return "MATCH"
        if a == b:
            return "MATCH"
        return "MINOR_MISMATCH"
    return "MATCH" if normalize_text(str(value_a)) == normalize_text(str(value_b)) else "MAJOR_MISMATCH"


def _field(document: Document, name: str) -> str | None:
    extracted = {item["field"]: item["value"] for item in (document.extracted_fields or [])}
    direct = getattr(document, name, None)
    return str(direct) if direct is not None else extracted.get(name)


def _issue(field: str, document_a: str, document_b: str, value_a: str | None, value_b: str | None, severity: str, action: str) -> dict:
    return {
        "field": field,
        "document_a": document_a,
        "document_b": document_b,
        "value_a": value_a or "UNKNOWN",
        "value_b": value_b or "UNKNOWN",
        "severity": severity,
        "recommended_action": action,
    }


def _validate_verhoeff_aadhaar(aadhaar: str) -> bool:
    clean = re.sub(r"\D", "", aadhaar)
    if len(clean) != 12:
        return False
    d = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]]
    p = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]]
    c = 0
    clean = clean[::-1]
    for i in range(12):
        c = d[c][p[i % 8][int(clean[i])]]
    return c == 0


def run_health_check(application: Application) -> tuple[str, list[dict], list[str]]:
    docs = {doc.document_type.upper(): doc for doc in application.documents}
    aliases = {
        "AADHAAR": ("AADHAAR", "IDENTITY"),
        "BANK_PASSBOOK": ("BANK_PASSBOOK", "BANK"),
        "INCOME_CERTIFICATE": ("INCOME_CERTIFICATE", "INCOME"),
        "RESIDENCE_CERTIFICATE": ("RESIDENCE_CERTIFICATE", "RESIDENCE"),
    }
    selected = {key: next((docs[name] for name in names if name in docs), None) for key, names in aliases.items()}
    issues: list[dict] = []
    compared = [doc.document_type.upper() for doc in selected.values() if doc]
    
    # 1. AADHAAR_FORMAT (UIDAI Verhoeff Checksum)
    identity = selected["AADHAAR"]
    if not identity:
        issues.append(_issue("document", "AADHAAR", "application", None, None, "MAJOR_MISMATCH", "Upload or provide your 12-digit Aadhaar number."))
    else:
        aadhaar_num = _field(identity, "document_number")
        if not aadhaar_num or not _validate_verhoeff_aadhaar(aadhaar_num):
            issues.append(_issue("document", "AADHAAR", "application", aadhaar_num, None, "MAJOR_MISMATCH", "Re-verify Aadhaar card number. A typo will cause immediate PFMS V-U1 rejection."))
            
    bank = selected["BANK_PASSBOOK"]
    if not bank:
        issues.append(_issue("document", "BANK_PASSBOOK", "application", None, None, "MAJOR_MISMATCH", "Bank Passbook is mandatory."))
        
    # 2. Cross-document mismatch detection
    comparison_docs = [doc for doc in selected.values() if doc]
    for first, second in combinations(comparison_docs, 2):
        for field in ("holder_name", "date_of_birth", "address", "state", "district"):
            left, right = _field(first, field), _field(second, field)
            result = compare_values(left, right, "name" if field == "holder_name" else field)
            if result in {"MAJOR_MISMATCH", "MINOR_MISMATCH"}:
                action = 'Potential mismatch detected. The relevant authority or bank should confirm which record needs correction.'
                issues.append(_issue(field, first.document_type.upper(), second.document_type.upper(), left, right, result, action))
                
    # 3. AADHAAR_BANK_SEEDING
    if bank:
        seeding_state = _field(bank, "seeding_reported") or "UNKNOWN"
        if seeding_state == "NOT_OK":
            issues.append(_issue("bank_seeding", "BANK_PASSBOOK", "NPCI_MAPPER", "NOT_OK", "OK", "MAJOR_MISMATCH", "Submit the Aadhaar Seeding & NPCI Mandate form to your home branch immediately."))
        elif seeding_state == "UNKNOWN":
            issues.append(_issue("bank_seeding", "BANK_PASSBOOK", "NPCI_MAPPER", "UNKNOWN", "OK", "MINOR_MISMATCH", "Check Aadhaar seeding status via bank SMS or branch inquiry."))
            
    today = date.today()
    for document in comparison_docs:
        expiry = _field(document, "expiry_date")
        if expiry and expiry != "UNKNOWN":
            try:
                if datetime.fromisoformat(expiry).date() < today or date.fromisoformat(expiry) < today:
                    issues.append(_issue("expiry_date", document.document_type.upper(), "application", expiry, None, "MAJOR_MISMATCH", "Upload a current valid document."))
            except ValueError:
                pass
                
    overall = "BLOCKED" if any(i["severity"] == "MAJOR_MISMATCH" for i in issues) else "WARNING" if issues else "HEALTHY"
    return overall, issues, compared
