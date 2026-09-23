import copy
import random
import string
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from app.schemas import (
    Restaurant,
    Table,
    TableStatus,
    WaitlistEntry,
    WaitlistStatus,
    GuestStatusResponse,
    DashboardStats,
    CreateWaitlistDTO,
    UpdateWaitlistDTO,
    CreateTableDTO,
)
from app.events import broadcaster

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def generate_token(prefix="guest") -> str:
    rand_chars = "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
    rand_digits = random.randint(1000, 9999)
    return f"{prefix}-{rand_chars}-{rand_digits}"

class MockDatabase:
    def __init__(self):
        self.reset()

    def reset(self):
        t_now = now_utc()

        self.restaurant = Restaurant(
            id="rest-001",
            name="Le Bistro MaitreQ",
            slug="le-bistro-maitreq",
            phone="+1 (555) 342-9800",
            address="452 Downtown Ave, Culinary District",
            created_at=t_now - timedelta(days=30),
        )

        self.tables: List[Table] = [
            Table(id="tbl-1", restaurant_id="rest-001", table_number="T1", capacity=2, status=TableStatus.OCCUPIED, current_party_id="entry-seated-1", current_guest_name="David Chen", updated_at=t_now - timedelta(minutes=30)),
            Table(id="tbl-2", restaurant_id="rest-001", table_number="T2", capacity=2, status=TableStatus.AVAILABLE, updated_at=t_now),
            Table(id="tbl-3", restaurant_id="rest-001", table_number="T3", capacity=4, status=TableStatus.AVAILABLE, updated_at=t_now),
            Table(id="tbl-4", restaurant_id="rest-001", table_number="T4", capacity=4, status=TableStatus.OCCUPIED, current_party_id="entry-seated-2", current_guest_name="Sophia Patel", updated_at=t_now - timedelta(minutes=45)),
            Table(id="tbl-5", restaurant_id="rest-001", table_number="T5", capacity=4, status=TableStatus.RESERVED, updated_at=t_now - timedelta(minutes=10)),
            Table(id="tbl-6", restaurant_id="rest-001", table_number="T6", capacity=6, status=TableStatus.AVAILABLE, updated_at=t_now),
            Table(id="tbl-7", restaurant_id="rest-001", table_number="T7", capacity=6, status=TableStatus.OCCUPIED, current_party_id="entry-seated-3", current_guest_name="Marcus Vance", updated_at=t_now - timedelta(minutes=50)),
            Table(id="tbl-8", restaurant_id="rest-001", table_number="T8", capacity=8, status=TableStatus.AVAILABLE, updated_at=t_now),
            Table(id="tbl-9", restaurant_id="rest-001", table_number="B1 (Booth)", capacity=4, status=TableStatus.AVAILABLE, updated_at=t_now),
            Table(id="tbl-10", restaurant_id="rest-001", table_number="B2 (Booth)", capacity=4, status=TableStatus.OCCUPIED, current_party_id="entry-seated-4", current_guest_name="Elena Rostova", updated_at=t_now - timedelta(minutes=20)),
        ]

        self.waitlist: List[WaitlistEntry] = [
            WaitlistEntry(
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
            WaitlistEntry(
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
            WaitlistEntry(
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
            WaitlistEntry(
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
            WaitlistEntry(
                id="entry-seated-1",
                restaurant_id="rest-001",
                table_id="tbl-1",
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
            WaitlistEntry(
                id="entry-seated-2",
                restaurant_id="rest-001",
                table_id="tbl-4",
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
            WaitlistEntry(
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
        self._recalculate_positions()

    def _recalculate_positions(self):
        active_index = 1
        for entry in self.waitlist:
            if entry.status in (WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED):
                entry.position = active_index
                if not entry.estimated_wait_minutes:
                    entry.estimated_wait_minutes = max(5, (active_index - 1) * 10 + (10 if entry.party_size > 4 else 5))
                active_index += 1
            else:
                entry.position = 0
                entry.estimated_wait_minutes = 0

    # --- Restaurant ---
    def get_restaurant(self) -> Restaurant:
        return copy.deepcopy(self.restaurant)

    # --- Waitlist ---
    def list_waitlist(self, status: Optional[str] = "ACTIVE") -> List[WaitlistEntry]:
        self._recalculate_positions()
        if not status or status == "ALL":
            return [copy.deepcopy(e) for e in self.waitlist]
        if status == "ACTIVE":
            return [copy.deepcopy(e) for e in self.waitlist if e.status in (WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED)]
        return [copy.deepcopy(e) for e in self.waitlist if e.status == status]

    def add_waitlist_entry(self, dto: CreateWaitlistDTO) -> WaitlistEntry:
        active_count = len([e for e in self.waitlist if e.status in (WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED)])
        computed_wait = dto.estimated_wait_minutes or max(10, active_count * 12 + (15 if dto.party_size > 4 else 5))
        
        entry = WaitlistEntry(
            id=f"entry-{int(now_utc().timestamp()*1000)}",
            restaurant_id=self.restaurant.id,
            guest_name=dto.guest_name.strip(),
            phone_number=dto.phone_number.strip(),
            party_size=dto.party_size,
            notes=dto.notes.strip() if dto.notes else None,
            status=WaitlistStatus.WAITING,
            public_token=generate_token(dto.guest_name.lower().split()[0]),
            position=active_count + 1,
            estimated_wait_minutes=computed_wait,
            created_at=now_utc(),
        )
        self.waitlist.insert(0, entry)
        self._recalculate_positions()
        broadcaster.broadcast("waitlist:created", entry.model_dump(mode="json"))
        broadcaster.broadcast("waitlist:updated")
        return copy.deepcopy(entry)

    def edit_waitlist_entry(self, entry_id: str, dto: UpdateWaitlistDTO) -> Optional[WaitlistEntry]:
        for entry in self.waitlist:
            if entry.id == entry_id:
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
                self._recalculate_positions()
                broadcaster.broadcast("waitlist:updated")
                return copy.deepcopy(entry)
        return None

    def update_waitlist_status(self, entry_id: str, status: WaitlistStatus, table_id: Optional[str] = None) -> Optional[WaitlistEntry]:
        target_entry = None
        for entry in self.waitlist:
            if entry.id == entry_id:
                target_entry = entry
                break

        if not target_entry:
            return None

        target_entry.status = status
        t_now = now_utc()

        if status == WaitlistStatus.NOTIFIED:
            if not target_entry.notified_at:
                target_entry.notified_at = t_now
        elif status == WaitlistStatus.SEATED:
            target_entry.seated_at = t_now
            if not target_entry.notified_at:
                target_entry.notified_at = t_now
            if table_id:
                target_entry.table_id = table_id
                # Update Table to OCCUPIED
                for tbl in self.tables:
                    if tbl.id == table_id:
                        tbl.status = TableStatus.OCCUPIED
                        tbl.current_party_id = target_entry.id
                        tbl.current_guest_name = target_entry.guest_name
                        tbl.updated_at = t_now
                        broadcaster.broadcast("tables:updated")
                        break
        elif status in (WaitlistStatus.CANCELLED, WaitlistStatus.NO_SHOW):
            target_entry.position = 0
            target_entry.estimated_wait_minutes = 0

        self._recalculate_positions()
        broadcaster.broadcast("waitlist:status_change", target_entry.model_dump(mode="json"))
        broadcaster.broadcast("waitlist:updated")
        return copy.deepcopy(target_entry)

    def reorder_queue(self, from_index: int, to_index: int) -> List[WaitlistEntry]:
        active = [e for e in self.waitlist if e.status in (WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED)]
        inactive = [e for e in self.waitlist if e.status not in (WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED)]

        if 0 <= from_index < len(active) and 0 <= to_index < len(active):
            moved = active.pop(from_index)
            active.insert(to_index, moved)
            self.waitlist = active + inactive
            self._recalculate_positions()
            broadcaster.broadcast("waitlist:updated")
        return self.list_waitlist("ACTIVE")

    # --- Tables ---
    def list_tables(self) -> List[Table]:
        return [copy.deepcopy(t) for t in self.tables]

    def create_table(self, dto: CreateTableDTO) -> Table:
        table = Table(
            id=f"tbl-{int(now_utc().timestamp()*1000)}",
            restaurant_id=self.restaurant.id,
            table_number=dto.table_number.strip(),
            capacity=dto.capacity,
            status=dto.status or TableStatus.AVAILABLE,
            updated_at=now_utc(),
        )
        self.tables.append(table)
        broadcaster.broadcast("tables:updated")
        return copy.deepcopy(table)

    def update_table_status(self, table_id: str, status: TableStatus, free_party: bool = False) -> Optional[Table]:
        for tbl in self.tables:
            if tbl.id == table_id:
                tbl.status = status
                if status == TableStatus.AVAILABLE or free_party:
                    tbl.current_party_id = None
                    tbl.current_guest_name = None
                tbl.updated_at = now_utc()
                broadcaster.broadcast("tables:updated")
                return copy.deepcopy(tbl)
        return None

    # --- Guest Public Portal ---
    def get_guest_by_token(self, token: str) -> Optional[GuestStatusResponse]:
        self._recalculate_positions()
        entry = next((e for e in self.waitlist if e.public_token == token), None)
        if not entry:
            return None

        assigned_table_number = None
        if entry.table_id:
            tbl = next((t for t in self.tables if t.id == entry.table_id), None)
            if tbl:
                assigned_table_number = tbl.table_number

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
            restaurant_name=self.restaurant.name,
            restaurant_phone=self.restaurant.phone,
            assigned_table_number=assigned_table_number,
        )

    def cancel_guest_by_token(self, token: str) -> Optional[GuestStatusResponse]:
        entry = next((e for e in self.waitlist if e.public_token == token), None)
        if not entry:
            return None
        self.update_waitlist_status(entry.id, WaitlistStatus.CANCELLED)
        return self.get_guest_by_token(token)

    # --- Dashboard Stats ---
    def get_dashboard_stats(self) -> DashboardStats:
        self._recalculate_positions()
        waiting = len([e for e in self.waitlist if e.status == WaitlistStatus.WAITING])
        notified = len([e for e in self.waitlist if e.status == WaitlistStatus.NOTIFIED])
        seated = len([e for e in self.waitlist if e.status == WaitlistStatus.SEATED])
        available_tbls = len([t for t in self.tables if t.status == TableStatus.AVAILABLE])

        waiting_entries = [e for e in self.waitlist if e.status == WaitlistStatus.WAITING]
        total_wait = sum(e.estimated_wait_minutes for e in waiting_entries)
        avg_wait = round(total_wait / len(waiting_entries)) if waiting_entries else 15

        return DashboardStats(
            total_waiting=waiting,
            total_notified=notified,
            total_seated_today=seated,
            avg_wait_minutes=avg_wait,
            available_tables=available_tbls,
            total_tables=len(self.tables),
        )

db = MockDatabase()
