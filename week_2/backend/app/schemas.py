from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field

class WaitlistStatus(str, Enum):
    WAITING = "WAITING"
    NOTIFIED = "NOTIFIED"
    SEATED = "SEATED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"

class TableStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    RESERVED = "RESERVED"

class Restaurant(BaseModel):
    id: str
    name: str
    slug: str
    phone: str
    address: Optional[str] = None
    created_at: datetime

class Table(BaseModel):
    id: str
    restaurant_id: str
    table_number: str
    capacity: int = Field(ge=1)
    status: TableStatus = TableStatus.AVAILABLE
    current_party_id: Optional[str] = None
    current_guest_name: Optional[str] = None
    updated_at: datetime

class WaitlistEntry(BaseModel):
    id: str
    restaurant_id: str
    table_id: Optional[str] = None
    guest_name: str
    phone_number: str
    party_size: int = Field(ge=1)
    notes: Optional[str] = None
    status: WaitlistStatus = WaitlistStatus.WAITING
    public_token: str
    position: int = Field(default=0, ge=0)
    estimated_wait_minutes: int = Field(default=0, ge=0)
    created_at: datetime
    notified_at: Optional[datetime] = None
    seated_at: Optional[datetime] = None

class GuestStatusResponse(BaseModel):
    id: str
    guest_name: str
    phone_number: str
    party_size: int
    status: WaitlistStatus
    position: int
    estimated_wait_minutes: int
    created_at: datetime
    notified_at: Optional[datetime] = None
    seated_at: Optional[datetime] = None
    restaurant_name: str
    restaurant_phone: str
    assigned_table_number: Optional[str] = None

class CreateWaitlistDTO(BaseModel):
    guest_name: str = Field(min_length=1)
    phone_number: str = Field(min_length=1)
    party_size: int = Field(ge=1)
    notes: Optional[str] = None
    estimated_wait_minutes: Optional[int] = Field(default=None, ge=0)

class UpdateWaitlistDTO(BaseModel):
    guest_name: Optional[str] = None
    phone_number: Optional[str] = None
    party_size: Optional[int] = Field(default=None, ge=1)
    notes: Optional[str] = None
    estimated_wait_minutes: Optional[int] = Field(default=None, ge=0)

class UpdateStatusDTO(BaseModel):
    status: WaitlistStatus
    table_id: Optional[str] = None

class ReorderQueueDTO(BaseModel):
    from_index: int = Field(ge=0)
    to_index: int = Field(ge=0)

class CreateTableDTO(BaseModel):
    table_number: str = Field(min_length=1)
    capacity: int = Field(ge=1)
    status: Optional[TableStatus] = TableStatus.AVAILABLE

class UpdateTableStatusDTO(BaseModel):
    status: TableStatus
    free_party: bool = False

class DashboardStats(BaseModel):
    total_waiting: int
    total_notified: int
    total_seated_today: int
    avg_wait_minutes: int
    available_tables: int
    total_tables: int

class ErrorResponse(BaseModel):
    error: str
    code: str
    details: Optional[Any] = None
