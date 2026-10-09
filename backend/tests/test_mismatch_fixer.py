from types import SimpleNamespace

from app.services.mismatch_fixer import build_resolution_plan


def mismatch(field_name: str, recommendation: str = "") -> SimpleNamespace:
    return SimpleNamespace(
        field_name=field_name,
        source_document="identity",
        conflicting_document="bank",
        source_value="Lakshmi Devi",
        conflicting_value="Lakshmi D",
        recommended_action=recommendation,
    )


def test_name_mismatch_plan() -> None:
    plan = build_resolution_plan(mismatch("name"))
    assert plan["rule"] == "NAME_MISMATCH"
    assert plan["may_block_application"] is True
    assert plan["likely_source_document"] == "identity"


def test_dob_mismatch_plan() -> None:
    assert build_resolution_plan(mismatch("date_of_birth"))["rule"] == "DOB_MISMATCH"


def test_address_mismatch_plan() -> None:
    assert build_resolution_plan(mismatch("address"))["rule"] == "ADDRESS_MISMATCH"


def test_missing_and_expired_plans() -> None:
    missing = mismatch("document", "Upload the required bank document.")
    expired = mismatch("expiry_date", "The document has expired.")
    assert build_resolution_plan(missing)["rule"] == "MISSING_DOCUMENT"
    assert build_resolution_plan(expired)["rule"] == "EXPIRED_DOCUMENT"
