import asyncio
import json
from datetime import datetime, timezone
from typing import Set, Any

class EventBroadcaster:
    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()

    async def subscribe(self) -> asyncio.Queue:
        queue = asyncio.Queue()
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        self._subscribers.discard(queue)

    def broadcast(self, event_type: str, payload: Any = None):
        envelope = {
            "type": event_type,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "sender_id": "backend_server"
        }
        data_str = json.dumps(envelope)
        for queue in list(self._subscribers):
            try:
                queue.put_nowait(data_str)
            except Exception:
                self._subscribers.discard(queue)

broadcaster = EventBroadcaster()
