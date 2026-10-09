from datetime import date, timedelta
from types import SimpleNamespace

from app.services.health_check import compare_names, compare_values, run_health_check


def document(kind: str, **values: object) -> SimpleNamespace:
    return SimpleNamespace(document_type=kind, extracted_fields=[], **values)


def test_name_comparison_cases() -> None:
    assert compare_names("Lakshmi Devi", "Lakshmi Devi") == "MATCH"
    assert compare_names("Lakshmi Devi", "Lakshmi D") == "MINOR_MISMATCH"
    assert compare_names("Lakshmi Devi", "Lakshami Devi") == "MINOR_MISMATCH"
    assert compare_names("Lakshmi Devi", "Ravi Kumar") == "MAJOR_MISMATCH"


def test_dob_and_address_comparison_cases() -> None:
    assert compare_values("1988-04-12", "1988-04-12", "date_of_birth") == "MATCH"
    assert compare_values("1988-04-12", "1989-04-12", "date_of_birth") == "MAJOR_MISMATCH"
    assert compare_values("Jaipur", "Jaipur", "address") == "MATCH"
    assert compare_values("Jaipur", "Delhi", "address") == "MAJOR_MISMATCH"
    assert compare_values("UNKNOWN", "Delhi", "address") == "UNKNOWN"


def test_health_check_reports_missing_and_expired_documents() -> None:
    application = SimpleNamespace(
        documents=[
            document("identity", holder_name="Lakshmi Devi", date_of_birth=date(1988, 4, 12), address="Jaipur"),
            document("residence_certificate", expiry_date=date.today() - timedelta(days=1)),
        ]
    )
    status, issues, compared = run_health_check(application)
    assert status == "HIGH_RISK"
    assert "identity" in compared
    assert any(issue["field"] == "document" for issue in issues)
    assert any(issue["field"] == "expiry_date" for issue in issues)
