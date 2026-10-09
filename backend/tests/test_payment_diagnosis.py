from app.services.payment_diagnosis import choose_failure


BASE = {
    "payment_approved": "yes",
    "payment_received": "no",
    "payment_released": "yes",
    "account_active": "yes",
    "seeded": "yes",
    "account_valid": "yes",
    "name_matches": "yes",
    "duplicate": "no",
    "payment_rejected": "no",
}


def path(**updates: str) -> dict:
    values = dict(BASE)
    values.update(updates)
    return values


def test_all_failure_categories() -> None:
    assert choose_failure({"payment_approved": "no"}) == "PAYMENT_NOT_RELEASED"
    assert choose_failure(path(seeded="no")) == "AADHAAR_NOT_SEEDED"
    assert choose_failure(path(account_valid="no")) == "BANK_ACCOUNT_INVALID"
    assert choose_failure(path(account_active="no")) == "BANK_ACCOUNT_INACTIVE"
    assert choose_failure(path(name_matches="no")) == "NAME_MISMATCH"
    assert choose_failure(path(duplicate="yes")) == "DUPLICATE_BENEFICIARY"
    assert choose_failure(path(payment_rejected="yes")) == "PAYMENT_REJECTED"
    assert choose_failure(path(payment_released="no")) == "PAYMENT_NOT_RELEASED"
    assert choose_failure(path(payment_received="yes")) == "UNKNOWN_PAYMENT_FAILURE"


def test_unknown_inputs_do_not_guess() -> None:
    assert choose_failure({"payment_approved": "unknown"}) is None
    assert choose_failure(path(seeded="unknown")) is None
