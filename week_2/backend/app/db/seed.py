from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import RestaurantModel, TableModel, WaitlistEntryModel
from app.schemas import WaitlistStatus, TableStatus

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

async def seed_database(session: AsyncSession):
    # Check if restaurant exists
    stmt = select(RestaurantModel).where(RestaurantModel.id == "rest-001")
    existing = (await session.execute(stmt)).scalar_one_or_none()
    if existing:
        return

    t_now = now_utc()

    restaurant = RestaurantModel(
        id="rest-001",
        name="Le Bistro MaitreQ",
        slug="le-bistro-maitreq",
        phone="+1 (555) 342-9800",
        address="452 Downtown Ave, Culinary District",
        created_at=t_now - timedelta(days=30),
    )
    session.add(restaurant)
    await session.flush()

    # 1. Insert waitlist entries first
    waitlist = [
        WaitlistEntryModel(
            id="entry-001",
            restaurant_id="rest-001",
            guest_name="Sarah Jenkins",
            phone_number="+1 (555) 234-5678",
            party_size=2,
            notes="Anniversary celebration. Prefers quiet booth if possible.",
            status=WaitlistStatus.NOTIFIED,
            public_token="sarah-j-9821",
            position=1,
            estimated_wait_minutes=5,
            created_at=t_now - timedelta(minutes=25),
            notified_at=t_now - timedelta(minutes=2),
        ),
        WaitlistEntryModel(
            id="entry-002",
            restaurant_id="rest-001",
            guest_name="Alex Rivera",
            phone_number="+1 (555) 876-5432",
            party_size=4,
            notes="High chair needed for toddler.",
            status=WaitlistStatus.WAITING,
            public_token="alex-r-4312",
            position=2,
            estimated_wait_minutes=15,
            created_at=t_now - timedelta(minutes=18),
        ),
        WaitlistEntryModel(
            id="entry-003",
            restaurant_id="rest-001",
            guest_name="Maya Lin",
            phone_number="+1 (555) 345-6789",
            party_size=2,
            notes="Outdoor patio preferred if open.",
            status=WaitlistStatus.WAITING,
            public_token="maya-l-7734",
            position=3,
            estimated_wait_minutes=25,
            created_at=t_now - timedelta(minutes=12),
        ),
        WaitlistEntryModel(
            id="entry-004",
            restaurant_id="rest-001",
            guest_name="Michael Sterling",
            phone_number="+1 (555) 901-2345",
            party_size=6,
            notes="Birthday dinner with family.",
            status=WaitlistStatus.WAITING,
            public_token="michael-s-1120",
            position=4,
            estimated_wait_minutes=40,
            created_at=t_now - timedelta(minutes=5),
        ),
        WaitlistEntryModel(
            id="entry-seated-1",
            restaurant_id="rest-001",
            table_id=None,
            guest_name="David Chen",
            phone_number="+1 (555) 456-7890",
            party_size=2,
            notes="Seated at Table T1",
            status=WaitlistStatus.SEATED,
            public_token="david-c-5591",
            position=0,
            estimated_wait_minutes=0,
            created_at=t_now - timedelta(minutes=60),
            notified_at=t_now - timedelta(minutes=35),
            seated_at=t_now - timedelta(minutes=30),
        ),
        WaitlistEntryModel(
            id="entry-seated-2",
            restaurant_id="rest-001",
            table_id=None,
            guest_name="Sophia Patel",
            phone_number="+1 (555) 678-9012",
            party_size=4,
            notes="Seated at Table T4",
            status=WaitlistStatus.SEATED,
            public_token="sophia-p-8823",
            position=0,
            estimated_wait_minutes=0,
            created_at=t_now - timedelta(minutes=80),
            notified_at=t_now - timedelta(minutes=50),
            seated_at=t_now - timedelta(minutes=45),
        ),
        WaitlistEntryModel(
            id="entry-cancelled-1",
            restaurant_id="rest-001",
            guest_name="Robert Fox",
            phone_number="+1 (555) 123-9999",
            party_size=3,
            notes="Changed plans",
            status=WaitlistStatus.CANCELLED,
            public_token="robert-f-0041",
            position=0,
            estimated_wait_minutes=0,
            created_at=t_now - timedelta(minutes=95),
        ),
    ]
    session.add_all(waitlist)
    await session.flush()

    # 2. Insert Tables
    tables = [
        TableModel(id="tbl-1", restaurant_id="rest-001", table_number="T1", capacity=2, status=TableStatus.OCCUPIED, current_party_id="entry-seated-1", current_guest_name="David Chen", updated_at=t_now - timedelta(minutes=30)),
        TableModel(id="tbl-2", restaurant_id="rest-001", table_number="T2", capacity=2, status=TableStatus.AVAILABLE, updated_at=t_now),
        TableModel(id="tbl-3", restaurant_id="rest-001", table_number="T3", capacity=4, status=TableStatus.AVAILABLE, updated_at=t_now),
        TableModel(id="tbl-4", restaurant_id="rest-001", table_number="T4", capacity=4, status=TableStatus.OCCUPIED, current_party_id="entry-seated-2", current_guest_name="Sophia Patel", updated_at=t_now - timedelta(minutes=45)),
        TableModel(id="tbl-5", restaurant_id="rest-001", table_number="T5", capacity=4, status=TableStatus.RESERVED, updated_at=t_now - timedelta(minutes=10)),
        TableModel(id="tbl-6", restaurant_id="rest-001", table_number="T6", capacity=6, status=TableStatus.AVAILABLE, updated_at=t_now),
        TableModel(id="tbl-7", restaurant_id="rest-001", table_number="T7", capacity=6, status=TableStatus.OCCUPIED, current_party_id=None, current_guest_name="Marcus Vance", updated_at=t_now - timedelta(minutes=50)),
        TableModel(id="tbl-8", restaurant_id="rest-001", table_number="T8", capacity=8, status=TableStatus.AVAILABLE, updated_at=t_now),
        TableModel(id="tbl-9", restaurant_id="rest-001", table_number="B1 (Booth)", capacity=4, status=TableStatus.AVAILABLE, updated_at=t_now),
        TableModel(id="tbl-10", restaurant_id="rest-001", table_number="B2 (Booth)", capacity=4, status=TableStatus.OCCUPIED, current_party_id=None, current_guest_name="Elena Rostova", updated_at=t_now - timedelta(minutes=20)),
    ]
    session.add_all(tables)
    await session.flush()

    # 3. Link seated parties to tables
    for entry in waitlist:
        if entry.id == "entry-seated-1":
            entry.table_id = "tbl-1"
        elif entry.id == "entry-seated-2":
            entry.table_id = "tbl-4"

    await session.commit()

async def reset_and_reseed_database(session: AsyncSession):
    await session.execute(delete(WaitlistEntryModel))
    await session.execute(delete(TableModel))
    await session.execute(delete(RestaurantModel))
    await session.commit()
    await seed_database(session)
