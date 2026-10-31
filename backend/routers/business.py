"""Business profile routes — public read (the enquiry form needs the copy and
service list), owner-only write. No customer data is exposed here.
"""

from fastapi import APIRouter, Depends

from lib.auth import get_current_owner
from lib.db import db
from models.business import BUSINESS_ID, Business, BusinessUpdate

router = APIRouter(prefix="/business", tags=["business"])


async def _load_business() -> Business:
    doc = await db.business.find_one({"id": BUSINESS_ID})
    return Business(**doc) if doc else Business()


@router.get("", response_model=Business)
async def get_business():
    return await _load_business()


@router.put("", response_model=Business)
async def update_business(payload: BusinessUpdate, _owner: dict = Depends(get_current_owner)):
    business = Business(**payload.model_dump())
    await db.business.replace_one({"id": BUSINESS_ID}, business.model_dump(), upsert=True)
    return business
