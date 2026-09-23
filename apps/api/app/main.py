from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import init_db
from .routers import auth, career, dashboard, goals, google_sync, habits, settings as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Bosla API", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(career.router)
app.include_router(goals.router)
app.include_router(habits.router)
app.include_router(dashboard.router)
app.include_router(settings_router.router)
app.include_router(google_sync.router)


@app.get("/health")
async def health() -> dict:
    return {"ok": True}
