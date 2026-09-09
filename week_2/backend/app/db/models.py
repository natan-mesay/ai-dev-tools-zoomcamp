import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    String,
    Integer,
    ForeignKey,
    Enum as SAEnum,
    Index,
    CheckConstraint,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from app.db.types import UTCDateTime
from app.schemas import WaitlistStatus, TableStatus

class Base(DeclarativeBase):
    pass

class RestaurantModel(Base):
    __tablename__ = "restaurants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    tables: Mapped[List["TableModel"]] = relationship(
        "TableModel", back_populates="restaurant", cascade="all, delete-orphan"
    )
    waitlist_entries: Mapped[List["WaitlistEntryModel"]] = relationship(
        "WaitlistEntryModel", back_populates="restaurant", cascade="all, delete-orphan"
    )

class TableModel(Base):
    __tablename__ = "tables"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "table_number", name="uq_restaurant_table_number"),
        CheckConstraint("capacity >= 1", name="ck_table_capacity_positive"),
        Index("ix_tables_restaurant_status", "restaurant_id", "status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    restaurant_id: Mapped[str] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    table_number: Mapped[str] = mapped_column(String(50), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[TableStatus] = mapped_column(
        SAEnum(TableStatus, native_enum=False, length=20),
        default=TableStatus.AVAILABLE,
        nullable=False,
    )
    current_party_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("waitlist_entries.id", ondelete="SET NULL", use_alter=True, name="fk_table_current_party"),
        nullable=True,
    )
    current_guest_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    restaurant: Mapped["RestaurantModel"] = relationship("RestaurantModel", back_populates="tables")
    current_party: Mapped[Optional["WaitlistEntryModel"]] = relationship(
        "WaitlistEntryModel", foreign_keys=[current_party_id], post_update=True
    )

class WaitlistEntryModel(Base):
    __tablename__ = "waitlist_entries"
    __table_args__ = (
        CheckConstraint("party_size >= 1", name="ck_waitlist_party_size_positive"),
        CheckConstraint("position >= 0", name="ck_waitlist_position_non_negative"),
        Index("ix_waitlist_restaurant_status_pos", "restaurant_id", "status", "position"),
        Index("ix_waitlist_restaurant_created", "restaurant_id", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    restaurant_id: Mapped[str] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    table_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("tables.id", ondelete="SET NULL"), nullable=True, index=True
    )
    guest_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    party_size: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[WaitlistStatus] = mapped_column(
        SAEnum(WaitlistStatus, native_enum=False, length=20),
        default=WaitlistStatus.WAITING,
        nullable=False,
        index=True,
    )
    public_token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estimated_wait_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    notified_at: Mapped[Optional[datetime]] = mapped_column(UTCDateTime, nullable=True)
    seated_at: Mapped[Optional[datetime]] = mapped_column(UTCDateTime, nullable=True)

    restaurant: Mapped["RestaurantModel"] = relationship("RestaurantModel", back_populates="waitlist_entries")
    assigned_table: Mapped[Optional["TableModel"]] = relationship("TableModel", foreign_keys=[table_id])
