from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import TableModel, WaitlistEntryModel
from app.schemas import DashboardStats, TableStatus, WaitlistStatus

async def get_dashboard_stats(session: AsyncSession) -> DashboardStats:
    # 1. Waiting count
    waiting_stmt = select(func.count(WaitlistEntryModel.id)).where(WaitlistEntryModel.status == WaitlistStatus.WAITING)
    total_waiting = (await session.execute(waiting_stmt)).scalar() or 0

    # 2. Notified count
    notified_stmt = select(func.count(WaitlistEntryModel.id)).where(WaitlistEntryModel.status == WaitlistStatus.NOTIFIED)
    total_notified = (await session.execute(notified_stmt)).scalar() or 0

    # 3. Seated count
    seated_stmt = select(func.count(WaitlistEntryModel.id)).where(WaitlistEntryModel.status == WaitlistStatus.SEATED)
    total_seated = (await session.execute(seated_stmt)).scalar() or 0

    # 4. Available tables
    avail_stmt = select(func.count(TableModel.id)).where(TableModel.status == TableStatus.AVAILABLE)
    available_tables = (await session.execute(avail_stmt)).scalar() or 0

    # 5. Total tables
    total_tbl_stmt = select(func.count(TableModel.id))
    total_tables = (await session.execute(total_tbl_stmt)).scalar() or 0

    # 6. Avg wait minutes
    wait_entries_stmt = select(WaitlistEntryModel.estimated_wait_minutes).where(
        WaitlistEntryModel.status == WaitlistStatus.WAITING
    )
    wait_times = (await session.execute(wait_entries_stmt)).scalars().all()
    avg_wait = round(sum(wait_times) / len(wait_times)) if wait_times else 15

    return DashboardStats(
        total_waiting=total_waiting,
        total_notified=total_notified,
        total_seated_today=total_seated,
        avg_wait_minutes=avg_wait,
        available_tables=available_tables,
        total_tables=total_tables,
    )
