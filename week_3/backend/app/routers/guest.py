from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas import GuestStatusResponse, ErrorResponse
from app.services import waitlist_service

router = APIRouter(prefix="/api/v1/status", tags=["Guest Portal"])

@router.get("/{token}", response_model=GuestStatusResponse, responses={404: {"model": ErrorResponse}})
async def get_guest_status(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    return await waitlist_service.get_guest_by_token(db, token)

@router.post("/{token}/cancel", response_model=GuestStatusResponse, responses={404: {"model": ErrorResponse}})
async def cancel_guest_status(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    return await waitlist_service.cancel_guest_by_token(db, token)
