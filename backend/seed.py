"""Seed the single owner account, the business profile and the demo leads.

Run: cd /app/backend && python seed.py
Idempotent — safe to re-run. Never deletes leads submitted through the public form.
"""

import asyncio
import uuid

from lib.auth import hash_password
from lib.db import db, ensure_indexes
from lib.demo import build_demo_leads
from models.business import BUSINESS_ID, DEFAULT_SERVICES, Business
from models.leads import now_utc

OWNER_EMAIL = "owner@business.com"
OWNER_PASSWORD = "password123"


async def main() -> None:
    await ensure_indexes()

    # Owner account — always reset the password so the documented login keeps working.
    existing = await db.owners.find_one({"email": OWNER_EMAIL})
    if existing:
        await db.owners.update_one(
            {"id": existing["id"]}, {"$set": {"password_hash": hash_password(OWNER_PASSWORD)}}
        )
        owner_id = existing["id"]
    else:
        owner_id = str(uuid.uuid4())
        await db.owners.insert_one(
            {
                "id": owner_id,
                "email": OWNER_EMAIL,
                "password_hash": hash_password(OWNER_PASSWORD),
                "created_at": now_utc(),
            }
        )

    # Business profile — keep the owner's edits if they already changed it.
    if not await db.business.find_one({"id": BUSINESS_ID}):
        business = Business(services=list(DEFAULT_SERVICES))
        await db.business.insert_one(business.model_dump())

    # Demo leads — only top up when there are none, never overwrite real enquiries.
    demo_count = await db.leads.count_documents({"is_demo": True})
    inserted = 0
    if demo_count == 0:
        docs = [dict(doc) for doc in build_demo_leads()]
        await db.leads.insert_many(docs)
        inserted = len(docs)

    total = await db.leads.count_documents({})
    print("Seed complete")
    print(f"  owner:    id={owner_id} email={OWNER_EMAIL} password={OWNER_PASSWORD}")
    print(f"  business: {await db.business.find_one({'id': BUSINESS_ID})}")
    print(f"  demo leads inserted: {inserted} (existing demo: {demo_count})")
    print(f"  leads in database: {total}")


if __name__ == "__main__":
    asyncio.run(main())
