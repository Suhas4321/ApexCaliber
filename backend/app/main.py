import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import MetaData, Table, func, inspect, select

from app.auth import LOCAL_USER_ID, validate_hosted_settings
from app.config import PROJECT_DIR, settings
from app.db import Base, SessionLocal, engine
from app.models import Draft, LessonProgress, PitchNote, Progress, Submission
from app.routers import backup, learning, playground, questions, stats, student, worlds
from app.services import backup_manager
from app.services.content_loader import sync_content
from app.services.learning_paths import sync_learning_paths

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("patternforge")

FRONTEND_DIST = PROJECT_DIR / "frontend" / "dist"


def startup() -> None:
    validate_hosted_settings()
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        sync_content(session, settings.content_dir)
        sync_learning_paths(session, settings.content_dir)
        if settings.app_mode == "local":
            # Old single-user tables remain untouched. Copy once into owner-keyed tables;
            # never import legacy local data into a hosted account automatically.
            existing = set(inspect(engine).get_table_names())
            for old_name, model in (
                ("progress", Progress), ("lesson_progress", LessonProgress),
                ("pitch_notes", PitchNote), ("drafts", Draft), ("submissions", Submission),
            ):
                if old_name not in existing or session.scalar(select(func.count()).select_from(model)):
                    continue
                old = Table(old_name, MetaData(), autoload_with=engine)
                columns = {column.name for column in model.__table__.columns}
                for row in session.execute(select(old)).mappings():
                    payload = {key: value for key, value in row.items() if key in columns}
                    session.add(model(user_id=LOCAL_USER_ID, **payload))
                session.commit()
        # Only restore a legacy local backup when none of the new local-owned tables has data.
        has_user_data = any(
            session.scalar(select(func.count()).select_from(model).where(model.user_id == LOCAL_USER_ID))
            for model in (Progress, LessonProgress, PitchNote, Draft, Submission)
        )
        if settings.app_mode == "local" and not has_user_data and backup_manager.backup_path().exists():
            counts = backup_manager.restore_from_file(session)
            log.info("restored user data from backup: %s", counts)
        elif settings.app_mode == "local" and has_user_data:
            backup_manager.auto_dump(session)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    startup()
    yield


app = FastAPI(title="ApexCaliber", lifespan=lifespan)
if settings.app_mode == "local":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "testserver"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.public_origin] if settings.app_mode == "hosted" else settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(worlds.router)
app.include_router(learning.router)
app.include_router(questions.router)
app.include_router(stats.router)
app.include_router(student.router)
if settings.app_mode == "local":
    app.include_router(backup.router)
app.include_router(playground.router)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/content/reload")
def reload_content():
    """Re-read content/ without restarting the server (handy while editing question files)."""
    if settings.app_mode != "local":
        raise HTTPException(404)
    with SessionLocal() as session:
        report = sync_content(session, settings.content_dir)
        sync_learning_paths(session, settings.content_dir)
    return {"worlds": report.worlds, "questions": report.questions,
            "with_content": report.with_content, "errors": report.errors}


# Serve the built frontend (npm run build) from the same server when it exists.
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(404)
        candidate = FRONTEND_DIST / path
        if path and candidate.is_file() and FRONTEND_DIST in candidate.resolve().parents:
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
