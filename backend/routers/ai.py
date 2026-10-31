"""AI Reply Generator route — owner-only, one grounded Gemini call per request.

Nothing is persisted and nothing is sent to the customer: the reply is returned for the
owner to review, edit and copy.
"""

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import get_current_owner
from lib.db import db
from lib.gemini import generate_reply
from models.ai import AiAnalysis, AiReply, AiReplyRequest, UNKNOWN_SERVICE
from routers.business import load_business
from models.leads import Lead

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/reply", response_model=AiReply)
async def create_ai_reply(payload: AiReplyRequest, _owner: dict = Depends(get_current_owner)):
    doc = await db.leads.find_one({"id": payload.lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found.")

    lead = Lead(**doc)
    message = (lead.message or "").strip()
    if len(message) < 5:
        raise HTTPException(
            status_code=400,
            detail="This enquiry has no usable message to analyse. Add the customer's question to the lead first.",
        )

    business = await load_business()

    result = await generate_reply(
        customer_name=lead.name.replace("DEMO - ", "").strip(),
        enquiry_message=message,
        service_of_interest=lead.service,
        status=lead.status,
        received_at=lead.created_at.isoformat(),
        follow_up_at=lead.follow_up_at.isoformat() if lead.follow_up_at else None,
        business_name=business.name,
    )
    data = result.payload

    requested_service = (data.requested_service or "").strip() or UNKNOWN_SERVICE
    analysis = AiAnalysis(
        customer_intent=data.customer_intent,
        requested_service=requested_service,
        urgency=data.urgency,
        booking_likelihood=data.booking_likelihood,
        booking_likelihood_reason=data.booking_likelihood_reason.strip(),
        recommended_next_action=data.recommended_next_action.strip(),
    )

    return AiReply(
        analysis=analysis,
        acknowledgement=data.acknowledgement.strip(),
        follow_up_action=data.follow_up_action.strip(),
        follow_up_timing=data.follow_up_timing.strip(),
        model=result.model,
        generated_at=result.generated_at,
        lead_id=lead.id,
        lead_status=lead.status,
        lead_is_booked=lead.status == "Booked",
        requested_service_from_lead=lead.service or None,
    )
