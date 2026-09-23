import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.events import broadcaster

router = APIRouter(prefix="/api/v1", tags=["Realtime"])

@router.get("/events")
async def sse_events():
    queue = await broadcaster.subscribe()

    async def event_generator():
        try:
            # Initial ping
            yield "event: ping\ndata: {}\n\n"
            while True:
                try:
                    # Wait for next event or send heartbeat every 20 seconds
                    data_str = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield f"event: message\ndata: {data_str}\n\n"
                except asyncio.TimeoutError:
                    yield "event: ping\ndata: {}\n\n"
        finally:
            broadcaster.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
