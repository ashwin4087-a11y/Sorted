from math import ceil
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Scheme, Operator
from app.schemas.schemes import SchemeDetail, SchemePage
from app.routers.auth import get_current_operator
from app.services.scheme_matcher import SchemeMatcher

router = APIRouter(prefix="/api/schemes", tags=["schemes"])


def scheme_query(
    state: str | None,
    level: str | None,
    category: str | None,
    application_mode: str | None,
    keyword: str | None,
):
    query = select(Scheme)
    if state:
        query = query.where(Scheme.state.ilike(f"%{state}%"))
    if level:
        query = query.where(Scheme.level.ilike(f"%{level}%"))
    if category:
        query = query.where(
            or_(
                Scheme.category.ilike(f"%{category}%"),
                cast(Scheme.tags, String).ilike(f"%{category}%"),
            )
        )
    if application_mode:
        query = query.where(Scheme.application_mode.ilike(f"%{application_mode}%"))
    if keyword:
        pattern = f"%{keyword}%"
        query = query.where(
            or_(
                Scheme.name.ilike(pattern),
                Scheme.description.ilike(pattern),
                Scheme.category.ilike(pattern),
                cast(Scheme.tags, String).ilike(pattern),
                cast(Scheme.eligibility_general, String).ilike(pattern),
                cast(Scheme.eligibility, String).ilike(pattern),
                cast(Scheme.exclusions, String).ilike(pattern),
                cast(Scheme.benefits, String).ilike(pattern),
                cast(Scheme.faqs, String).ilike(pattern),
            )
        )
    return query


@router.get("", response_model=SchemePage)
@router.get("/search", response_model=SchemePage, include_in_schema=False)
def list_schemes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    state: str | None = None,
    level: str | None = None,
    category: str | None = None,
    application_mode: str | None = None,
    keyword: str | None = None,
    db: Session = Depends(get_db),
) -> SchemePage:
    base_query = scheme_query(state, level, category, application_mode, keyword)
    total = db.scalar(select(func.count()).select_from(base_query.subquery())) or 0
    items = list(
        db.scalars(
            base_query.order_by(Scheme.name.asc()).offset((page - 1) * limit).limit(limit)
        ).all()
    )
    return SchemePage(
        items=items,
        page=page,
        limit=limit,
        total=total,
        pages=ceil(total / limit) if total else 0,
    )


@router.get("/{scheme_id}", response_model=SchemeDetail)
def get_scheme(scheme_id: UUID, db: Session = Depends(get_db)) -> Scheme:
    scheme = db.get(Scheme, scheme_id)
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme

@router.get("/{scheme_id}/eligibility")
def get_scheme_eligibility(
    scheme_id: UUID, 
    citizen_id: UUID,
    db: Session = Depends(get_db),
    operator: Operator = Depends(get_current_operator)
):
    matcher = SchemeMatcher(db)
    try:
        result = matcher.evaluate_eligibility(str(citizen_id), str(scheme_id))
        return {
            "status": result.status,
            "match_score": result.match_score,
            "can_apply": result.status == "ELIGIBLE" or result.status == "LIKELY_ELIGIBLE",
            "reasons": result.reasons,
            "missing_information": result.missing_information
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/user/eligible")
def list_eligible_schemes(
    citizen_id: UUID,
    db: Session = Depends(get_db),
    operator: Operator = Depends(get_current_operator)
):
    matcher = SchemeMatcher(db)
    schemes = db.query(Scheme).limit(100).all() # Evaluate a batch
    eligible = []
    for s in schemes:
        res = matcher.evaluate_eligibility(str(citizen_id), str(s.id))
        if res.status in ["ELIGIBLE", "LIKELY_ELIGIBLE"]:
            eligible.append({
                "scheme": s,
                "eligibility": {
                    "status": res.status,
                    "match_score": res.match_score,
                    "reasons": res.reasons,
                    "missing_information": res.missing_information
                }
            })
    return eligible

@router.get("/user/needs-verification")
def list_needs_verification_schemes(
    citizen_id: UUID,
    db: Session = Depends(get_db),
    operator: Operator = Depends(get_current_operator)
):
    matcher = SchemeMatcher(db)
    schemes = db.query(Scheme).limit(100).all()
    needs = []
    for s in schemes:
        res = matcher.evaluate_eligibility(str(citizen_id), str(s.id))
        if res.status == "NEEDS_VERIFICATION":
            needs.append({
                "scheme": s,
                "eligibility": {
                    "status": res.status,
                    "match_score": res.match_score,
                    "reasons": res.reasons,
                    "missing_information": res.missing_information
                }
            })
    return needs
