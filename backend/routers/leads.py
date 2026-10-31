"""Lead routes.

`POST /leads` is the only public write in the app — everything else on this
router requires the owner session, so customer contact details never leak to a
visitor of the enquiry form.
"""

import re
from datetime import timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo import ReturnDocument

from lib.auth import get_current_owner
from lib.db import db
from lib.demo import build_demo_leads
from models.leads import (
    INACTIVE_STATUSES,
    LEAD_STATUSES,
    Lead,
    LeadCreate,
    LeadStats,
    LeadUpdate,
    Reminders,
    SeedResult,
    now_utc,
)

router = APIRouter(prefix="/leads", tags=["leads"])

UPCOMING_WINDOW_DAYS = 7


def _active_followup_filter() -> dict:
    """Leads still awaiting a follow-up: not Booked/Closed, and due now.

    A lead flagged "Follow-up Due" without an explicit timestamp counts as due.
    """
    return {
        "status": {"$nin": list(INACTIVE_STATUSES)},
        "$or": [
            {"follow_up_at": {"$lte": now_utc()}},
            {"status": "Follow-up Due"},
        ],
    }


async def _find_lead(lead_id: str) -> dict:
    doc = await db.leads.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found.")
    return doc


@router.post("", response_model=Lead)
async def create_lead(payload: LeadCreate):
    """Public enquiry form submission — validated by Pydantic before we get here."""
    lead = Lead(**payload.model_dump())
    await db.leads.insert_one(lead.model_dump())
    return lead


@router.get("", response_model=list[Lead])
async def list_leads(
    status: str | None = Query(default=None),
    q: str | None = Query(default=None, max_length=80),
    _owner: dict = Depends(get_current_owner),
):
    query: dict = {}
    if status and status in LEAD_STATUSES:
        query["status"] = status
    if q and q.strip():
        pattern = re.escape(q.strip())
        query["$or"] = [
            {"name": {"$regex": pattern, "$options": "i"}},
            {"contact": {"$regex": pattern, "$options": "i"}},
            {"service": {"$regex": pattern, "$options": "i"}},
        ]
    docs = await db.leads.find(query).sort("created_at", -1).to_list(500)
    return [Lead(**doc) for doc in docs]


@router.get("/stats", response_model=LeadStats)
async def lead_stats(_owner: dict = Depends(get_current_owner)):
    return LeadStats(
        total=await db.leads.count_documents({}),
        new=await db.leads.count_documents({"status": "New"}),
        followups_due=await db.leads.count_documents(_active_followup_filter()),
        booked=await db.leads.count_documents({"status": "Booked"}),
    )


@router.get("/reminders", response_model=Reminders)
async def lead_reminders(_owner: dict = Depends(get_current_owner)):
    overdue_docs = (
        await db.leads.find(_active_followup_filter()).sort("follow_up_at", 1).to_list(200)
    )
    upcoming_docs = (
        await db.leads.find(
            {
                "status": {"$nin": list(INACTIVE_STATUSES)},
                "follow_up_at": {
                    "$gt": now_utc(),
                    "$lte": now_utc() + timedelta(days=UPCOMING_WINDOW_DAYS),
                },
            }
        )
        .sort("follow_up_at", 1)
        .to_list(200)
    )
    return Reminders(
        overdue=[Lead(**doc) for doc in overdue_docs],
        upcoming=[Lead(**doc) for doc in upcoming_docs],
    )


@router.patch("/{lead_id}", response_model=Lead)
async def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    _owner: dict = Depends(get_current_owner),
):
    fields: dict = {"updated_at": now_utc()}
    if payload.status is not None:
        fields["status"] = payload.status
    if payload.clear_follow_up:
        fields["follow_up_at"] = None
    elif payload.follow_up_at is not None:
        follow_up = payload.follow_up_at
        if follow_up.tzinfo is None:
            follow_up = follow_up.replace(tzinfo=timezone.utc)
        fields["follow_up_at"] = follow_up

    if len(fields) == 1:
        raise HTTPException(status_code=400, detail="Nothing to update.")

    await _find_lead(lead_id)
    doc = await db.leads.find_one_and_update(
        {"id": lead_id}, {"$set": fields}, return_document=ReturnDocument.AFTER
    )
    return Lead(**doc)


@router.post("/demo/seed", response_model=SeedResult)
async def seed_demo_leads(_owner: dict = Depends(get_current_owner)):
    """Replace the labelled demo leads. Never touches leads submitted by customers."""
    deleted = (await db.leads.delete_many({"is_demo": True})).deleted_count
    docs = build_demo_leads()
    await db.leads.insert_many([dict(doc) for doc in docs])
    return SeedResult(inserted=len(docs), deleted=deleted)


@router.delete("/demo", response_model=SeedResult)
async def clear_demo_leads(_owner: dict = Depends(get_current_owner)):
    deleted = (await db.leads.delete_many({"is_demo": True})).deleted_count
    return SeedResult(inserted=0, deleted=deleted)
