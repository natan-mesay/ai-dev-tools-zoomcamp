import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import RestaurantModel, TableModel
from app.schemas import CreateTableDTO, TableStatus
from app.events import broadcaster

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

async def list_tables(session: AsyncSession) -> List[TableModel]:
    stmt = select(TableModel).order_by(TableModel.table_number.asc())
    result = await session.execute(stmt)
    return list(result.scalars().all())

async def create_table(session: AsyncSession, dto: CreateTableDTO) -> TableModel:
    rest_stmt = select(RestaurantModel).limit(1)
    restaurant = (await session.execute(rest_stmt)).scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=500, detail={"error": "Restaurant not found", "code": "RESTAURANT_NOT_FOUND"})

    table = TableModel(
        id=f"tbl-{uuid.uuid4().hex[:8]}",
        restaurant_id=restaurant.id,
        table_number=dto.table_number.strip(),
        capacity=dto.capacity,
        status=dto.status or TableStatus.AVAILABLE,
        updated_at=now_utc(),
    )
    session.add(table)
    await session.commit()
    await session.refresh(table)

    broadcaster.broadcast("tables:updated")
    return table

async def update_table_status(
    session: AsyncSession, table_id: str, status: TableStatus, free_party: bool = False
) -> TableModel:
    stmt = select(TableModel).where(TableModel.id == table_id)
    table = (await session.execute(stmt)).scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail={"error": f"Table {table_id} not found", "code": "NOT_FOUND"})

    table.status = status
    if status == TableStatus.AVAILABLE or free_party:
        table.current_party_id = None
        table.current_guest_name = None
    table.updated_at = now_utc()

    await session.commit()
    await session.refresh(table)
    broadcaster.broadcast("tables:updated")
    return table
