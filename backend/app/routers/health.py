from fastapi import APIRouter

from app.config import get_settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse.healthy(get_settings().app_name)

