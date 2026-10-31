"""Business profile — drives the public enquiry form copy and the service dropdown."""

from pydantic import BaseModel, Field, field_validator

BUSINESS_ID = "business"

# Industry-neutral defaults so the app can be rebranded for any service business.
DEFAULT_BUSINESS_NAME = "Missed Lead Recovery"
DEFAULT_TAGLINE = "Never lose another enquiry again."
DEFAULT_SERVICES = [
    "Consultation",
    "Standard Service",
    "Premium Package",
    "Repair / Maintenance",
    "Other",
]


class Business(BaseModel):
    id: str = BUSINESS_ID
    name: str = DEFAULT_BUSINESS_NAME
    tagline: str = DEFAULT_TAGLINE
    services: list[str] = Field(default_factory=lambda: list(DEFAULT_SERVICES))


class BusinessUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    tagline: str = Field(default="", max_length=140)
    services: list[str] = Field(min_length=1, max_length=12)

    @field_validator("name", "tagline")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("services")
    @classmethod
    def _clean_services(cls, value: list[str]) -> list[str]:
        cleaned = [service.strip() for service in value if service.strip()]
        if not cleaned:
            raise ValueError("Add at least one service.")
        return cleaned
