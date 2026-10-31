"""Pydantic v2 models for leads, follow-up reminders and demo-data seeding."""

import re
import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

LeadStatus = Literal["New", "Acknowledgement Sent", "Follow-up Due", "Booked", "Closed"]

LEAD_STATUSES: tuple[str, ...] = (
    "New",
    "Acknowledgement Sent",
    "Follow-up Due",
    "Booked",
    "Closed",
)

# A lead in one of these states is never an active follow-up again.
INACTIVE_STATUSES: tuple[str, ...] = ("Booked", "Closed")

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")


def now_utc() -> datetime:
    """Aware UTC now — always store aware datetimes so JS parses the offset."""
    return datetime.now(timezone.utc)


def normalize_contact(value: str) -> str:
    """Contact must be a usable email address or a phone number with 7+ digits."""
    cleaned = value.strip()
    if _EMAIL_RE.match(cleaned):
        return cleaned
    digits = re.sub(r"\D", "", cleaned)
    if len(digits) >= 7:
        return cleaned
    raise ValueError("Enter a valid email address or a phone number with at least 7 digits.")


class LeadCreate(BaseModel):
    """Public enquiry payload — the only body an unauthenticated visitor can send."""

    name: str = Field(min_length=2, max_length=80)
    contact: str = Field(min_length=5, max_length=120)
    service: str = Field(min_length=1, max_length=80)
    message: str = Field(min_length=5, max_length=1000)

    @field_validator("name", "service", "message")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field cannot be empty.")
        return cleaned

    @field_validator("contact")
    @classmethod
    def _valid_contact(cls, value: str) -> str:
        return normalize_contact(value)


class Lead(BaseModel):
    """Stored lead. String uuid ids only — never Mongo ObjectId."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    contact: str
    service: str
    message: str
    status: LeadStatus = "New"
    follow_up_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    is_demo: bool = False

    @model_validator(mode="after")
    def _aware_datetimes(self) -> "Lead":
        # Motor hands back naive datetimes; without the tzinfo JS reads them as local time.
        for field in ("created_at", "updated_at", "follow_up_at"):
            value = getattr(self, field)
            if isinstance(value, datetime) and value.tzinfo is None:
                setattr(self, field, value.replace(tzinfo=timezone.utc))
        return self


class LeadUpdate(BaseModel):
    """Owner-side partial update of a lead."""

    status: Optional[LeadStatus] = None
    follow_up_at: Optional[datetime] = None
    clear_follow_up: bool = False


class LeadStats(BaseModel):
    total: int
    new: int
    followups_due: int
    booked: int


class Reminders(BaseModel):
    overdue: list[Lead]
    upcoming: list[Lead]


class SeedResult(BaseModel):
    inserted: int
    deleted: int = 0
