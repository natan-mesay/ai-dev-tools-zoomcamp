from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.seed import reset_and_reseed_database
from app.db.session import get_db
from app.schemas import DashboardStats
from app.services import dashboard_service

router = APIRouter(prefix="/api/v1", tags=["Dashboard & Demo"])

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    return await dashboard_service.get_dashboard_stats(db)

@router.post("/demo/reset")
async def reset_demo(db: AsyncSession = Depends(get_db)):
    await reset_and_reseed_database(db)
    return {"success": True, "message": "Demo data reset successfully"}
