import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers.health import router as health_router
from app.routers.citizens import router as citizens_router
from app.routers.applications import router as applications_router
from app.routers.schemes import router as schemes_router
from app.routers.documents import router as documents_router
from app.routers.health_checks import router as health_checks_router
from app.routers.mismatch import router as mismatch_router
from app.routers.payment_diagnosis import router as payment_diagnosis_router
from app.routers.agent import router as agent_router
from app.routers.auth import router as auth_router

settings = get_settings()
logger = logging.getLogger(__name__)
app = FastAPI(
    title=settings.app_name,
    description="API foundation for the Sorted citizen benefits assistant.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled API error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred."},
    )


app.include_router(health_router)
app.include_router(citizens_router)
app.include_router(applications_router)
app.include_router(schemes_router)
app.include_router(documents_router)
app.include_router(health_checks_router)
app.include_router(mismatch_router)
app.include_router(payment_diagnosis_router)
app.include_router(agent_router, prefix="/api")
app.include_router(auth_router)
