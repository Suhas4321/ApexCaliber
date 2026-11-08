"""Concept lessons and their prerequisite-aware mastery checks."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import ChallengePrerequisite, LearningModule, Lesson, LessonPrerequisite, LessonProgress, Progress, Question, utcnow
from app.services.backup_manager import auto_dump

router = APIRouter(prefix="/api", tags=["learning"])


class CheckAnswer(BaseModel):
    answer: int = Field(ge=0)


def _mastered(session: Session) -> set[str]:
    return set(session.scalars(select(LessonProgress.lesson_id).where(LessonProgress.mastered.is_(True))))


def required_lessons(session: Session, slug: str) -> list[dict]:
    rows = session.execute(
        select(Lesson.id, Lesson.title, LessonProgress.mastered)
        .join(ChallengePrerequisite, ChallengePrerequisite.lesson_id == Lesson.id)
        .outerjoin(LessonProgress, LessonProgress.lesson_id == Lesson.id)
        .where(ChallengePrerequisite.question_slug == slug)
        .order_by(Lesson.position)
    ).all()
    return [{"id": lesson_id, "title": title, "mastered": bool(mastered)} for lesson_id, title, mastered in rows]


@router.get("/learning-paths/summary")
def learning_summary(session: Session = Depends(get_session)):
    total_concepts = session.scalar(select(func.count()).select_from(Lesson)) or 0
    concepts_mastered = session.scalar(select(func.count()).select_from(LessonProgress).where(LessonProgress.mastered.is_(True))) or 0
    total_challenges = session.scalar(select(func.count()).select_from(Question)) or 0
    challenges_solved = session.scalar(select(func.count()).select_from(Progress).where(Progress.solved.is_(True))) or 0
    return {"concepts_mastered": concepts_mastered, "total_concepts": total_concepts,
            "challenges_solved": challenges_solved, "total_challenges": total_challenges}


@router.get("/learning-paths/{citadel_id}")
def learning_path(citadel_id: str, session: Session = Depends(get_session)):
    modules = session.scalars(select(LearningModule).where(LearningModule.citadel_id == citadel_id).order_by(LearningModule.position)).all()
    if not modules:
        raise HTTPException(404, "No authored learning path for this citadel yet")
    mastered = _mastered(session)
    edges = session.execute(select(LessonPrerequisite.lesson_id, LessonPrerequisite.prerequisite_id)).all()
    parents: dict[str, list[str]] = {}
    for lesson_id, parent in edges:
        parents.setdefault(lesson_id, []).append(parent)
    prerequisite_ids = {parent for _, parent in edges}
    prerequisite_titles = dict(session.execute(select(Lesson.id, Lesson.title).where(Lesson.id.in_(prerequisite_ids))).all()) if prerequisite_ids else {}
    output = []
    for module in modules:
        lessons = session.scalars(select(Lesson).where(Lesson.module_id == module.id).order_by(Lesson.position)).all()
        completed = all(lesson.id in mastered for lesson in lessons)
        output.append({
            "id": module.id, "title": module.title, "summary": module.summary,
            "position": module.position, "completed": completed,
            "cue_card": module.cue_card if completed else None,
            "lessons": [{"id": lesson.id, "title": lesson.title, "summary": lesson.summary,
                         "position": lesson.position, "mastered": lesson.id in mastered,
                         "prerequisites": parents.get(lesson.id, []),
                         "prerequisite_details": [{"id": parent, "title": prerequisite_titles[parent]} for parent in parents.get(lesson.id, [])],
                         "ready": all(parent in mastered for parent in parents.get(lesson.id, []))}
                        for lesson in lessons],
        })
    return {"citadel_id": citadel_id, "modules": output}


@router.get("/lessons/{lesson_id}")
def lesson_detail(lesson_id: str, session: Session = Depends(get_session)):
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Unknown lesson")
    parents = session.scalars(select(LessonPrerequisite.prerequisite_id).where(LessonPrerequisite.lesson_id == lesson_id)).all()
    prerequisite_titles = dict(session.execute(select(Lesson.id, Lesson.title).where(Lesson.id.in_(parents))).all()) if parents else {}
    mastered = _mastered(session)
    progress = session.get(LessonProgress, lesson_id)
    content = dict(lesson.content)
    content["checks"] = [{"prompt": item["prompt"], "choices": item["choices"]} for item in content["checks"]]
    module = session.get(LearningModule, lesson.module_id)
    return {"id": lesson.id, "module_id": lesson.module_id, "citadel_id": module.citadel_id, "title": lesson.title,
            "summary": lesson.summary, "position": lesson.position, "content": content,
            "prerequisites": list(parents),
            "prerequisite_details": [{"id": parent, "title": prerequisite_titles[parent]} for parent in parents],
            "ready": all(parent in mastered for parent in parents),
            "passed_checks": progress.passed_checks if progress else [], "mastered": bool(progress and progress.mastered)}


@router.post("/lessons/{lesson_id}/checks/{check_index}")
def check_lesson(lesson_id: str, check_index: int, body: CheckAnswer, session: Session = Depends(get_session)):
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Unknown lesson")
    parents = session.scalars(select(LessonPrerequisite.prerequisite_id).where(LessonPrerequisite.lesson_id == lesson_id)).all()
    mastered = _mastered(session)
    if any(parent not in mastered for parent in parents):
        raise HTTPException(409, "Complete the prerequisite lessons first")
    checks = lesson.content["checks"]
    if not 0 <= check_index < len(checks):
        raise HTTPException(404, "Unknown check")
    check = checks[check_index]
    if body.answer >= len(check["choices"]):
        raise HTTPException(422, "Answer is outside the choices")
    correct = body.answer == check["answer"]
    progress = session.get(LessonProgress, lesson_id) or LessonProgress(lesson_id=lesson_id, passed_checks=[])
    passed = set(progress.passed_checks or [])
    if correct:
        passed.add(check_index)
    progress.passed_checks = sorted(passed)
    progress.mastered = len(passed) == len(checks)
    if progress.mastered and progress.mastered_at is None:
        progress.mastered_at = utcnow()
    session.add(progress)
    session.commit()
    auto_dump(session)
    return {"correct": correct, "explanation": check["explanation"],
            "passed_checks": progress.passed_checks, "mastered": progress.mastered}
