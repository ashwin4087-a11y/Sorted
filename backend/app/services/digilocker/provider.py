from abc import ABC, abstractmethod
from typing import Dict, Any

class DigiLockerProvider(ABC):
    @abstractmethod
    def verify_document(self, document_type: str, document_id: str) -> dict[str, Any]:
        """
        Verify a document via DigiLocker and return the verified data.
        """
        pass

    @abstractmethod
    def get_citizen_profile(self, digilocker_id: str) -> dict[str, Any]:
        """
        Get the full citizen profile from DigiLocker.
        """
        pass
