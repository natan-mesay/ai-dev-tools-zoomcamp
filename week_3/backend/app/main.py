import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException
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

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "app": "MaitreQ API",
        "version": "1.0.0",
    }


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except HTTPException as ex:
            # For 404s on browser navigation routes (non-API, non-asset, no file extension), serve index.html
            if (
                ex.status_code == 404
                and not path.startswith("api")
                and not path.startswith("assets")
                and "." not in path.split("/")[-1]
            ):
                return await super().get_response("index.html", scope)
            raise


# Static directory resolution:
# 1. Environment variable STATIC_DIR
# 2. backend/static directory
# 3. frontent/dist directory (development setup)
static_dir = os.getenv("STATIC_DIR")
if not static_dir:
    backend_static = Path(__file__).resolve().parent.parent / "static"
    if backend_static.is_dir() and (backend_static / "index.html").is_file():
        static_dir = str(backend_static)
    else:
        frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontent" / "dist"
        if frontend_dist.is_dir() and (frontend_dist / "index.html").is_file():
            static_dir = str(frontend_dist)

if static_dir and Path(static_dir).is_dir() and (Path(static_dir) / "index.html").is_file():
    app.mount("/", SPAStaticFiles(directory=static_dir, html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        return {
            "app": "MaitreQ API",
            "version": "1.0.0",
            "orm": "SQLAlchemy 2.0 (Async)",
            "docs": "/docs",
            "status": "healthy",
        }
