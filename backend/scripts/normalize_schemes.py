import re
from collections.abc import Mapping


def clean(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "null", "n/a", "na", "-"}:
        return None
    return text


def split_tags(value: object) -> list[str]:
    text = clean(value)
    if not text:
        return []
    # Replace newlines with spaces for tag splitting, though unlikely
    text = text.replace('\n', ' ').replace('\r', '')
    return [part.strip() for part in re.split(r"[,;|]", text) if part.strip()]


def normalize_row(row: Mapping[str, object]) -> dict:
    level = clean(row.get("Level"))
    location = clean(row.get("State / UT / Ministry"))
    is_state = bool(level and "state" in level.lower())
    tags = split_tags(row.get("Tags / Categories"))
    return {
        "scheme_code": clean(row.get("Scheme Slug")),
        "name": clean(row.get("Scheme Name")),
        "level": level,
        "state": location if is_state else None,
        "ministry": location if not is_state else None,
        "category": tags[0] if tags else None,
        "tags": tags,
        "description": clean(row.get("Description")),
        "eligibility": clean(row.get("Eligibility Criteria")),
        "benefits": clean(row.get("Benefits")),
        "required_documents": clean(row.get("Documents Required")),
        "application_process": clean(row.get("Application Process")),
        "official_url": clean(row.get("Official Link")),
        "myscheme_url": clean(row.get("MyScheme URL")),
        "application_mode": clean(row.get("Application Mode")),
        "eligibility_general": clean(row.get("Eligibility (General)")),
        "exclusions": clean(row.get("Exclusions / Ineligibility")),
        "faqs": clean(row.get("Frequently Asked Questions (FAQs)")),
        "source": "https://github.com/Aryan-Pardeshi/gov-myscheme-dataset",
    }
