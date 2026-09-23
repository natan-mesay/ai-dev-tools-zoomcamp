from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, TypeDecorator

class UTCDateTime(TypeDecorator):
    """
    Database-agnostic DateTime type decorator that guarantees timezone-aware UTC datetime objects.
    """
    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: Optional[datetime], dialect):
        if value is not None:
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            else:
                value = value.astimezone(timezone.utc)
        return value

    def process_result_value(self, value: Optional[datetime], dialect) -> Optional[datetime]:
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
