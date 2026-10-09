from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import String, cast, func, or_, select

from app.database import get_db
from app.models.entities import AgentActivity, Scheme

router = APIRouter(prefix="/api/agent", tags=["agent"])

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    suggested_actions: list[str] = []

@router.post("/chat", response_model=ChatResponse)
def agent_chat(request: ChatRequest, db: Session = Depends(get_db)):
    msg = request.message.lower()
    
    activity_in = AgentActivity(
        session_id=request.session_id,
        action="USER_MESSAGE",
        status="success",
        description=request.message,
    )
    db.add(activity_in)
    db.commit()

    reply = "I am the SORTED AI Agent. How can I assist you today?"
    actions = ["Run Health Check", "Discover Schemes"]

    # Basic entity extraction (naive)
    search_keywords = ["pm kisan", "pm-kisan", "pmay", "scholarship", "ayushman", "farmer", "student", "women"]
    found_keyword = None
    for kw in search_keywords:
        if kw in msg:
            found_keyword = kw
            break
            
    # Try generic state lookup
    if "tamil nadu" in msg:
        found_keyword = "tamil nadu"
        
    if "what is" in msg or "who is eligible" in msg or "documents" in msg or "apply" in msg or "benefits" in msg or "website" in msg or found_keyword:
        kw_search = found_keyword if found_keyword else msg.replace("what is ", "").replace("?", "").strip()
        if len(kw_search) > 3:
            pattern = f"%{kw_search}%"
            scheme = db.query(Scheme).filter(
                or_(
                    Scheme.name.ilike(pattern),
                    Scheme.state.ilike(pattern),
                    Scheme.category.ilike(pattern),
                    Scheme.description.ilike(pattern),
                    cast(Scheme.tags, String).ilike(pattern)
                )
            ).first()
            
            if scheme:
                if "who is eligible" in msg or "eligibility" in msg:
                    reply = f"For **{scheme.name}**, the eligibility is: {str(scheme.eligibility_general or scheme.eligibility)[:500]}..."
                elif "documents" in msg:
                    reply = f"The documents required for **{scheme.name}** are: {str(scheme.required_documents)[:500]}..."
                elif "apply" in msg or "application" in msg:
                    reply = f"To apply for **{scheme.name}** ({scheme.application_mode}): {str(scheme.application_process)[:500]}..."
                elif "benefits" in msg:
                    reply = f"The benefits provided by **{scheme.name}** are: {str(scheme.benefits)[:500]}..."
                elif "website" in msg or "official link" in msg:
                    reply = f"The official website for **{scheme.name}** is: {scheme.official_url or 'Not available'}. You can also visit MyScheme: {scheme.myscheme_url or 'Not available'}."
                else:
                    reply = f"**{scheme.name}** ({scheme.level}): {str(scheme.description)[:500]}..."
                actions = ["Who is eligible?", "What are the benefits?", "How to apply?", "Required documents?"]
            else:
                reply = "The available dataset does not provide sufficient information for this query. I couldn't find a specific scheme matching your request."
        else:
            reply = "Please provide more details about the scheme you are looking for."

    elif "health" in msg or "check" in msg:
        reply = "It looks like you want to run a Health Check on your application documents. Please provide your Application ID."
    elif "payment" in msg or "fail" in msg:
        reply = "I can help diagnose why your payment is stuck. Did you receive any error code?"
        
    activity_out = AgentActivity(
        session_id=request.session_id,
        action="AGENT_REPLY",
        status="success",
        description=reply,
    )
    db.add(activity_out)
    db.commit()

    return ChatResponse(reply=reply, suggested_actions=actions)
