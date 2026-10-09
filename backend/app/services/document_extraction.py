import re
import io

from pypdf import PdfReader
from pypdf.errors import PdfReadError

FIELDS = (
    "holder_name",
    "date_of_birth",
    "address",
    "document_number",
    "bank_account_last4",
    "IFSC",
    "issue_date",
    "expiry_date",
    "income",
    "state",
    "district",
)


def _unknown() -> list[dict]:
    return [{"field": field, "value": "UNKNOWN", "confidence": 0.0} for field in FIELDS]


def extract_text(data: bytes, mime_type: str) -> str:
    if mime_type == "text/plain":
        return data.decode("utf-8")
    if mime_type == "application/pdf":
        return "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(data)).pages)
    try:
        import pytesseract
        from PIL import Image

        return pytesseract.image_to_string(Image.open(io.BytesIO(data)))
    except (ImportError, OSError, RuntimeError):
        return ""


def _value(text: str, labels: str, confidence: float = 0.95) -> tuple[str, float]:
    match = re.search(rf"(?:{labels})\s*[:\-]\s*(.+)", text, re.IGNORECASE)
    if match:
        return match.group(1).splitlines()[0].strip(), confidence
    return "UNKNOWN", 0.0


def extract_fields(data: bytes, mime_type: str) -> list[dict]:
    try:
        text = extract_text(data, mime_type)
    except (PdfReadError, OSError, ValueError):
        text = ""
    if not text.strip():
        return _unknown()
    results: list[dict] = []
    patterns = {
        "holder_name": r"name|holder name|account holder",
        "date_of_birth": r"date of birth|dob|birth date",
        "address": r"address|residential address",
        "document_number": r"document number|certificate number|id number|aadhaar",
        "IFSC": r"ifsc|ifsc code",
        "issue_date": r"issue date|issued on",
        "expiry_date": r"expiry date|valid till|valid until",
        "income": r"income|annual income",
        "state": r"state",
        "district": r"district",
    }
    for field in FIELDS:
        if field == "bank_account_last4":
            match = re.search(
                r"(?:account number|a/c no|bank account)\s*[:\-]?\s*(?:X{4,}|\*{4,})?(\d{4,})\b",
                text,
                re.I,
            )
            value, confidence = (f"****{match.group(1)[-4:]}", 0.95) if match else ("UNKNOWN", 0.0)
        else:
            value, confidence = _value(text, patterns[field])
            if field == "document_number" and value != "UNKNOWN":
                digits = re.sub(r"\D", "", value)
                if len(digits) >= 12:
                    value = f"XXXX XXXX {digits[-4:]}"
        results.append({"field": field, "value": value, "confidence": confidence})
    return results
