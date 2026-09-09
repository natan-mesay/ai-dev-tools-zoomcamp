from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.db.models import Base
from app.db.seed import seed_database
from app.db.session import engine, async_session_factory
from app.routers import restaurant, waitlist, tables, guest, dashboard, events

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed if empty
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        await seed_database(session)

    yield

    # Cleanup engine on shutdown
    await engine.dispose()

app = FastAPI(
    title="MaitreQ API",
    description="Restaurant Waitlist Manager MVP Backend API with SQLAlchemy",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "code": "INTERNAL_SERVER_ERROR", "details": None},
    )

# Routers
app.include_router(restaurant.router)
app.include_router(waitlist.router)
app.include_router(tables.router)
app.include_router(guest.router)
app.include_router(dashboard.router)
app.include_router(events.router)

@app.get("/")
async def root():
    return {
        "app": "MaitreQ API",
        "version": "1.0.0",
        "orm": "SQLAlchemy 2.0 (Async)",
        "docs": "/docs",
        "status": "healthy"
    }
