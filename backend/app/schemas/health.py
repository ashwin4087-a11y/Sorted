from datetime import datetime, timezone

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime

    @classmethod
    def healthy(cls, service: str) -> "HealthResponse":
        return cls(
            status="ok",
            service=service,
            timestamp=datetime.now(timezone.utc),
        )

