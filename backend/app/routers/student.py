"""Student-owned learning state that was previously browser-only."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import optional_student, require_student
from app.db import get_session
from app.models import SystemDesignCompletion

router = APIRouter(prefix="/api/me", tags=["student"])


@router.get("/system-design")
def system_design_progress(session: Session = Depends(get_session), user_id: str | None = Depends(optional_student)):
    if user_id is None:
        return {"completed_ids": []}
    ids = session.scalars(select(SystemDesignCompletion.assignment_id).where(
        SystemDesignCompletion.user_id == user_id).order_by(SystemDesignCompletion.assignment_id)).all()
    return {"completed_ids": ids}


@router.post("/system-design/{assignment_id}", status_code=204)
def complete_system_design(assignment_id: str, session: Session = Depends(get_session), user_id: str = Depends(require_student)):
    if not assignment_id or len(assignment_id) > 128 or not all(c.isalnum() or c in "-_" for c in assignment_id):
        raise HTTPException(422, "Invalid assignment")
    if session.get(SystemDesignCompletion, (user_id, assignment_id)) is None:
        session.add(SystemDesignCompletion(user_id=user_id, assignment_id=assignment_id))
        session.commit()
