import os
from app.services.digilocker.provider import DigiLockerProvider
from app.services.digilocker.mock_provider import MockDigiLockerProvider
from app.services.digilocker.prod_provider import ProdDigiLockerProvider

def get_digilocker_provider() -> DigiLockerProvider:
    mode = os.getenv("DIGILOCKER_MODE", "mock").lower()
    if mode == "production":
        return ProdDigiLockerProvider()
    return MockDigiLockerProvider()
