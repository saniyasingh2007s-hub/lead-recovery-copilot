"""Models for the AI Reply Generator (direct Google Gemini API, server-side key only)."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

CustomerIntent = Literal[
    "Appointment request",
    "Pricing enquiry",
    "Service enquiry",
    "Complaint",
    "General question",
]
Urgency = Literal["low", "normal", "high"]
BookingLikelihood = Literal["low", "medium", "high"]

INTENTS: tuple[str, ...] = (
    "Appointment request",
    "Pricing enquiry",
    "Service enquiry",
    "Complaint",
    "General question",
)
URGENCIES: tuple[str, ...] = ("low", "normal", "high")
LIKELIHOODS: tuple[str, ...] = ("low", "medium", "high")

UNKNOWN_SERVICE = "Not identifiable from this enquiry"


class AiReplyRequest(BaseModel):
    """The client sends only the lead id — the enquiry text is read from the database."""

    lead_id: str = Field(min_length=1, max_length=80)


class AiAnalysis(BaseModel):
    customer_intent: CustomerIntent
    requested_service: str
    urgency: Urgency
    booking_likelihood: BookingLikelihood
    booking_likelihood_reason: str
    recommended_next_action: str


class AiReply(BaseModel):
    analysis: AiAnalysis
    acknowledgement: str
    follow_up_action: str
    follow_up_timing: str
    model: str
    generated_at: datetime
    lead_id: str
    lead_status: str
    lead_is_booked: bool = False
    requested_service_from_lead: Optional[str] = None
