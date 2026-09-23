from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas import (
    WaitlistEntry,
    CreateWaitlistDTO,
    UpdateWaitlistDTO,
    UpdateStatusDTO,
    ReorderQueueDTO,
    ErrorResponse,
)
from app.services import waitlist_service

router = APIRouter(prefix="/api/v1/waitlist", tags=["Waitlist"])

@router.get("", response_model=List[WaitlistEntry])
async def list_waitlist(
    status_filter: Optional[str] = Query(default="ACTIVE", alias="status"),
    db: AsyncSession = Depends(get_db),
):
    return await waitlist_service.list_waitlist(db, status_filter)

@router.post("", response_model=WaitlistEntry, status_code=status.HTTP_201_CREATED, responses={400: {"model": ErrorResponse}})
async def create_waitlist_entry(
    dto: CreateWaitlistDTO,
    db: AsyncSession = Depends(get_db),
):
    return await waitlist_service.add_waitlist_entry(db, dto)

@router.patch("/{entry_id}", response_model=WaitlistEntry, responses={404: {"model": ErrorResponse}})
async def edit_waitlist_entry(
    entry_id: str,
    dto: UpdateWaitlistDTO,
    db: AsyncSession = Depends(get_db),
):
    return await waitlist_service.edit_waitlist_entry(db, entry_id, dto)

@router.patch("/{entry_id}/status", response_model=WaitlistEntry, responses={404: {"model": ErrorResponse}})
async def update_waitlist_status(
    entry_id: str,
    dto: UpdateStatusDTO,
    db: AsyncSession = Depends(get_db),
):
    return await waitlist_service.update_waitlist_status(db, entry_id, dto.status, dto.table_id)

@router.post("/reorder", response_model=List[WaitlistEntry])
async def reorder_queue(
    dto: ReorderQueueDTO,
    db: AsyncSession = Depends(get_db),
):
    return await waitlist_service.reorder_queue(db, dto.from_index, dto.to_index)
