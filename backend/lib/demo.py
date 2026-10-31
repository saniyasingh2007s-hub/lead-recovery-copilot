"""Clearly-labelled fictional demo leads (is_demo=True).

Shared by `backend/seed.py` and the owner-only "load demo leads" endpoint so the
demo data has exactly one definition. None of these are real customers.
"""

from datetime import timedelta

from models.business import DEFAULT_SERVICES
from models.leads import Lead, now_utc

SERVICES = DEFAULT_SERVICES


def build_demo_leads() -> list[dict]:
    """Five demo leads covering every status, one with an overdue follow-up."""
    now = now_utc()

    leads = [
        Lead(
            name="DEMO - Aisha Kapoor",
            contact="+91 98200 41123",
            service=SERVICES[0],
            message="Hi, I would like to know your availability this week and your starting price.",
            status="New",
            created_at=now - timedelta(minutes=25),
        ),
        Lead(
            name="DEMO - Rohan Mehta",
            contact="rohan.mehta@example.com",
            service=SERVICES[1],
            message="Please share the package details and how long the process usually takes.",
            status="Acknowledgement Sent",
            follow_up_at=now + timedelta(days=2),
            created_at=now - timedelta(hours=5),
        ),
        Lead(
            name="DEMO - Priya Nair",
            contact="+91 99870 22145",
            service=SERVICES[2],
            message="I enquired last week but have not heard back. Can someone call me?",
            status="Follow-up Due",
            follow_up_at=now - timedelta(days=1, hours=3),
            created_at=now - timedelta(days=3),
        ),
        Lead(
            name="DEMO - Daniel Fernando",
            contact="daniel.f@example.com",
            service=SERVICES[3],
            message="Confirmed for Saturday morning slot, please keep the booking open.",
            status="Booked",
            follow_up_at=now - timedelta(days=2),
            created_at=now - timedelta(days=5),
        ),
        Lead(
            name="DEMO - Meera Shah",
            contact="+91 90045 77812",
            service=SERVICES[4],
            message="Thank you, I went with another provider. Closing my enquiry.",
            status="Closed",
            created_at=now - timedelta(days=8),
        ),
    ]

    docs = []
    for lead in leads:
        doc = lead.model_dump()
        doc["is_demo"] = True
        doc["updated_at"] = lead.created_at
        docs.append(doc)
    return docs
