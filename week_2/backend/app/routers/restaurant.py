from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import RestaurantModel
from app.db.session import get_db
from app.schemas import Restaurant

router = APIRouter(prefix="/api/v1/restaurant", tags=["Restaurant"])

@router.get("", response_model=Restaurant)
async def get_restaurant(db: AsyncSession = Depends(get_db)):
    stmt = select(RestaurantModel).limit(1)
    restaurant = (await db.execute(stmt)).scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail={"error": "Restaurant not found", "code": "NOT_FOUND"})
    return restaurant
