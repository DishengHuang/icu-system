import subprocess
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.api.routes import router

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "eicu.db"


def _db_needs_init() -> bool:
    if not DB_PATH.exists():
        return True
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(f"sqlite:///{DB_PATH}")
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM patient")).scalar()
        return not count
    except Exception:
        return True


@asynccontextmanager
async def lifespan(app: FastAPI):
    if _db_needs_init():
        print("=== Database not found — loading from CSVs (this takes a few minutes) ===",
              flush=True)
        result = subprocess.run(
            [sys.executable, str(BASE_DIR / "load_data.py")],
            cwd=str(BASE_DIR),
        )
        if result.returncode != 0:
            print("WARNING: load_data.py exited with errors", flush=True)
    else:
        print("=== Database already loaded ===", flush=True)
    yield


app = FastAPI(title="eICU Full-Stack Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")
