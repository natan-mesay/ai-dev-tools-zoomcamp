import random
import string
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import RestaurantModel, TableModel, WaitlistEntryModel
from app.schemas import (
    CreateWaitlistDTO,
    UpdateWaitlistDTO,
    WaitlistStatus,
    TableStatus,
    GuestStatusResponse,
)
from app.events import broadcaster

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def generate_token(name: str) -> str:
    prefix = name.lower().split()[0] if name else "guest"
    clean_prefix = "".join(c for c in prefix if c.isalnum()) or "guest"
    rand_chars = "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
    rand_digits = random.randint(1000, 9999)
    return f"{clean_prefix}-{rand_chars}-{rand_digits}"

async def recalculate_active_positions(session: AsyncSession, restaurant_id: str):
    stmt = (
        select(WaitlistEntryModel)
        .where(
            WaitlistEntryModel.restaurant_id == restaurant_id,
            WaitlistEntryModel.status.in_([WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED]),
        )
        .order_by(WaitlistEntryModel.position.asc(), WaitlistEntryModel.created_at.asc())
    )
    active_entries = (await session.execute(stmt)).scalars().all()

    for idx, entry in enumerate(active_entries, start=1):
        entry.position = idx
        if not entry.estimated_wait_minutes or entry.estimated_wait_minutes == 0:
            entry.estimated_wait_minutes = max(5, (idx - 1) * 10 + (10 if entry.party_size > 4 else 5))
    await session.flush()

async def list_waitlist(session: AsyncSession, status: Optional[str] = "ACTIVE") -> List[WaitlistEntryModel]:
    stmt = select(WaitlistEntryModel).order_by(WaitlistEntryModel.position.asc(), WaitlistEntryModel.created_at.desc())
    if status == "ACTIVE":
        stmt = stmt.where(WaitlistEntryModel.status.in_([WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED]))
    elif status and status != "ALL":
        stmt = stmt.where(WaitlistEntryModel.status == status)

    result = await session.execute(stmt)
    return list(result.scalars().all())

async def add_waitlist_entry(session: AsyncSession, dto: CreateWaitlistDTO) -> WaitlistEntryModel:
    rest_stmt = select(RestaurantModel).limit(1)
    restaurant = (await session.execute(rest_stmt)).scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=500, detail={"error": "Restaurant not found", "code": "RESTAURANT_NOT_FOUND"})

    count_stmt = select(WaitlistEntryModel).where(
        WaitlistEntryModel.restaurant_id == restaurant.id,
        WaitlistEntryModel.status.in_([WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED]),
    )
    active_count = len((await session.execute(count_stmt)).scalars().all())
    computed_wait = dto.estimated_wait_minutes or max(10, active_count * 12 + (15 if dto.party_size > 4 else 5))

    entry = WaitlistEntryModel(
        id=f"entry-{uuid.uuid4().hex[:8]}",
        restaurant_id=restaurant.id,
        guest_name=dto.guest_name.strip(),
        phone_number=dto.phone_number.strip(),
        party_size=dto.party_size,
        notes=dto.notes.strip() if dto.notes else None,
        status=WaitlistStatus.WAITING,
        public_token=generate_token(dto.guest_name),
        position=active_count + 1,
        estimated_wait_minutes=computed_wait,
        created_at=now_utc(),
    )
    session.add(entry)
    await session.flush()
    await recalculate_active_positions(session, restaurant.id)
    await session.commit()
    await session.refresh(entry)

    broadcaster.broadcast("waitlist:created", {
        "id": entry.id,
        "guest_name": entry.guest_name,
        "party_size": entry.party_size,
        "status": entry.status.value,
        "position": entry.position,
    })
    broadcaster.broadcast("waitlist:updated")
    return entry

async def edit_waitlist_entry(session: AsyncSession, entry_id: str, dto: UpdateWaitlistDTO) -> WaitlistEntryModel:
    stmt = select(WaitlistEntryModel).where(WaitlistEntryModel.id == entry_id)
    entry = (await session.execute(stmt)).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail={"error": f"Waitlist entry {entry_id} not found", "code": "NOT_FOUND"})

    if dto.guest_name is not None:
        entry.guest_name = dto.guest_name.strip()
    if dto.phone_number is not None:
        entry.phone_number = dto.phone_number.strip()
    if dto.party_size is not None:
        entry.party_size = dto.party_size
    if dto.notes is not None:
        entry.notes = dto.notes.strip() if dto.notes else None
    if dto.estimated_wait_minutes is not None:
        entry.estimated_wait_minutes = dto.estimated_wait_minutes

    await session.commit()
    await session.refresh(entry)
    broadcaster.broadcast("waitlist:updated")
    return entry

async def update_waitlist_status(
    session: AsyncSession, entry_id: str, status: WaitlistStatus, table_id: Optional[str] = None
) -> WaitlistEntryModel:
    stmt = select(WaitlistEntryModel).where(WaitlistEntryModel.id == entry_id)
    entry = (await session.execute(stmt)).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail={"error": f"Waitlist entry {entry_id} not found", "code": "NOT_FOUND"})

    t_now = now_utc()
    entry.status = status

    if status == WaitlistStatus.NOTIFIED:
        if not entry.notified_at:
            entry.notified_at = t_now
    elif status == WaitlistStatus.SEATED:
        entry.seated_at = t_now
        if not entry.notified_at:
            entry.notified_at = t_now
        entry.position = 0
        entry.estimated_wait_minutes = 0

        if table_id:
            table_stmt = select(TableModel).where(TableModel.id == table_id)
            table = (await session.execute(table_stmt)).scalar_one_or_none()
            if not table:
                raise HTTPException(status_code=404, detail={"error": f"Table {table_id} not found", "code": "NOT_FOUND"})

            entry.table_id = table.id
            table.status = TableStatus.OCCUPIED
            table.current_party_id = entry.id
            table.current_guest_name = entry.guest_name
            table.updated_at = t_now
            broadcaster.broadcast("tables:updated")
    elif status in (WaitlistStatus.CANCELLED, WaitlistStatus.NO_SHOW):
        entry.position = 0
        entry.estimated_wait_minutes = 0

    await session.flush()
    await recalculate_active_positions(session, entry.restaurant_id)
    await session.commit()
    await session.refresh(entry)

    broadcaster.broadcast("waitlist:status_change", {
        "id": entry.id,
        "guest_name": entry.guest_name,
        "status": entry.status.value,
        "position": entry.position,
    })
    broadcaster.broadcast("waitlist:updated")
    return entry

async def reorder_queue(session: AsyncSession, from_index: int, to_index: int) -> List[WaitlistEntryModel]:
    stmt = (
        select(WaitlistEntryModel)
        .where(WaitlistEntryModel.status.in_([WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED]))
        .order_by(WaitlistEntryModel.position.asc(), WaitlistEntryModel.created_at.asc())
    )
    active = list((await session.execute(stmt)).scalars().all())

    if 0 <= from_index < len(active) and 0 <= to_index < len(active):
        moved = active.pop(from_index)
        active.insert(to_index, moved)
        for idx, item in enumerate(active, start=1):
            item.position = idx
        await session.commit()
        broadcaster.broadcast("waitlist:updated")

    return active

async def get_guest_by_token(session: AsyncSession, token: str) -> GuestStatusResponse:
    stmt = select(WaitlistEntryModel).where(WaitlistEntryModel.public_token == token)
    entry = (await session.execute(stmt)).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail={"error": f"Waitlist entry not found for token: {token}", "code": "NOT_FOUND"})

    rest_stmt = select(RestaurantModel).where(RestaurantModel.id == entry.restaurant_id)
    restaurant = (await session.execute(rest_stmt)).scalar_one_or_none()

    table_num = None
    if entry.table_id:
        tbl_stmt = select(TableModel).where(TableModel.id == entry.table_id)
        tbl = (await session.execute(tbl_stmt)).scalar_one_or_none()
        if tbl:
            table_num = tbl.table_number

    return GuestStatusResponse(
        id=entry.id,
        guest_name=entry.guest_name,
        phone_number=entry.phone_number,
        party_size=entry.party_size,
        status=entry.status,
        position=entry.position,
        estimated_wait_minutes=entry.estimated_wait_minutes,
        created_at=entry.created_at,
        notified_at=entry.notified_at,
        seated_at=entry.seated_at,
        restaurant_name=restaurant.name if restaurant else "MaitreQ Restaurant",
        restaurant_phone=restaurant.phone if restaurant else "+1 (555) 000-0000",
        assigned_table_number=table_num,
    )

async def cancel_guest_by_token(session: AsyncSession, token: str) -> GuestStatusResponse:
    stmt = select(WaitlistEntryModel).where(WaitlistEntryModel.public_token == token)
    entry = (await session.execute(stmt)).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail={"error": f"Waitlist entry not found for token: {token}", "code": "NOT_FOUND"})

    await update_waitlist_status(session, entry.id, WaitlistStatus.CANCELLED)
    return await get_guest_by_token(session, token)
