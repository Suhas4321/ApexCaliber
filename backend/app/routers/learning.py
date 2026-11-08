"""Concept lessons and their prerequisite-aware mastery checks."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.db import get_session
from app.auth import LOCAL_USER_ID, optional_student, require_student
from app.models import ChallengePrerequisite, LearningModule, Lesson, LessonPrerequisite, LessonProgress, Progress, Question, utcnow
from app.services.backup_manager import auto_dump

router = APIRouter(prefix="/api", tags=["learning"])


class CheckAnswer(BaseModel):
    answer: int = Field(ge=0)


def _mastered(session: Session, user_id: str | None = LOCAL_USER_ID) -> set[str]:
    if user_id is None:
        return set()
    return set(session.scalars(select(LessonProgress.lesson_id).where(
        LessonProgress.user_id == user_id, LessonProgress.mastered.is_(True))))


def _ordered_prerequisites(session: Session, targets: list[str]) -> list[str]:
    """Return the full prerequisite chain with every parent before its child."""
    edges = session.execute(select(LessonPrerequisite.lesson_id, LessonPrerequisite.prerequisite_id)).all()
    lesson_positions = {
        lesson_id: (module_position, lesson_position, lesson_id)
        for lesson_id, module_position, lesson_position in session.execute(
            select(Lesson.id, LearningModule.position, Lesson.position)
            .join(LearningModule, LearningModule.id == Lesson.module_id)
        )
    }
    parents: dict[str, list[str]] = {}
    for lesson_id, parent_id in edges:
        parents.setdefault(lesson_id, []).append(parent_id)
    order: list[str] = []
    seen: set[str] = set()

    def visit(lesson_id: str) -> None:
        if lesson_id in seen:
            return
        seen.add(lesson_id)
        for parent_id in sorted(parents.get(lesson_id, []), key=lesson_positions.__getitem__):
            visit(parent_id)
        order.append(lesson_id)

    for lesson_id in sorted(targets, key=lesson_positions.__getitem__):
        visit(lesson_id)
    return order


def required_lessons(session: Session, slug: str, user_id: str | None = LOCAL_USER_ID) -> list[dict]:
    targets = session.scalars(
        select(ChallengePrerequisite.lesson_id)
        .where(ChallengePrerequisite.question_slug == slug)
        .order_by(ChallengePrerequisite.lesson_id)
    ).all()
    ordered = _ordered_prerequisites(session, list(targets))
    if not ordered:
        return []
    details = session.execute(
        select(Lesson.id, Lesson.title, LessonProgress.mastered)
        .outerjoin(LessonProgress, and_(LessonProgress.lesson_id == Lesson.id,
                                        LessonProgress.user_id == (user_id or "")))
        .where(Lesson.id.in_(ordered))
    ).all()
    by_id = {lesson_id: {"id": lesson_id, "title": title, "mastered": bool(mastered)}
             for lesson_id, title, mastered in details}
    return [by_id[lesson_id] for lesson_id in ordered]


@router.get("/learning-paths/summary")
def learning_summary(session: Session = Depends(get_session), user_id: str | None = Depends(optional_student)):
    total_concepts = session.scalar(select(func.count()).select_from(Lesson)) or 0
    concepts_mastered = session.scalar(select(func.count()).select_from(LessonProgress).where(
        LessonProgress.user_id == (user_id or ""), LessonProgress.mastered.is_(True))) or 0
    total_challenges = session.scalar(select(func.count()).select_from(Question)) or 0
    challenges_solved = session.scalar(select(func.count()).select_from(Progress).where(
        Progress.user_id == (user_id or ""), Progress.solved.is_(True))) or 0
    return {"concepts_mastered": concepts_mastered, "total_concepts": total_concepts,
            "challenges_solved": challenges_solved, "total_challenges": total_challenges}


@router.get("/learning-paths/{citadel_id}")
def learning_path(citadel_id: str, session: Session = Depends(get_session), user_id: str | None = Depends(optional_student)):
    modules = session.scalars(select(LearningModule).where(LearningModule.citadel_id == citadel_id).order_by(LearningModule.position)).all()
    if not modules:
        raise HTTPException(404, "No authored learning path for this citadel yet")
    mastered = _mastered(session, user_id)
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
        linked_questions = session.execute(
            select(Question.slug, Question.title)
            .join(ChallengePrerequisite, ChallengePrerequisite.question_slug == Question.slug)
            .join(Lesson, Lesson.id == ChallengePrerequisite.lesson_id)
            .where(Lesson.module_id == module.id)
            .order_by(Question.world_id, Question.position)
        ).all()
        practice_challenges = list({slug: {"slug": slug, "title": title}
                                    for slug, title in linked_questions}.values())
        output.append({
            "id": module.id, "title": module.title, "summary": module.summary,
            "position": module.position, "completed": completed,
            "cue_card": module.cue_card if completed else None,
            "practice_challenges": practice_challenges,
            "lessons": [{"id": lesson.id, "title": lesson.title, "summary": lesson.summary,
                         "position": lesson.position, "mastered": lesson.id in mastered,
                         "prerequisites": parents.get(lesson.id, []),
                         "prerequisite_details": [{"id": parent, "title": prerequisite_titles[parent], "mastered": parent in mastered} for parent in parents.get(lesson.id, [])],
                         "ready": all(parent in mastered for parent in parents.get(lesson.id, []))}
                        for lesson in lessons],
        })
    return {"citadel_id": citadel_id, "modules": output}


@router.get("/lessons/{lesson_id}")
def lesson_detail(lesson_id: str, session: Session = Depends(get_session), user_id: str | None = Depends(optional_student)):
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Unknown lesson")
    parents = session.scalars(select(LessonPrerequisite.prerequisite_id).where(LessonPrerequisite.lesson_id == lesson_id)).all()
    prerequisite_chain = _ordered_prerequisites(session, list(parents))
    prerequisite_titles = dict(session.execute(select(Lesson.id, Lesson.title).where(Lesson.id.in_(prerequisite_chain))).all()) if prerequisite_chain else {}
    mastered = _mastered(session, user_id)
    progress = session.get(LessonProgress, (user_id, lesson_id)) if user_id else None
    content = dict(lesson.content)
    content["checks"] = [{"prompt": item["prompt"], "choices": item["choices"]} for item in content["checks"]]
    module = session.get(LearningModule, lesson.module_id)
    return {"id": lesson.id, "module_id": lesson.module_id, "citadel_id": module.citadel_id, "title": lesson.title,
            "summary": lesson.summary, "position": lesson.position, "content": content,
            "prerequisites": list(parents),
            "prerequisite_details": [{"id": parent, "title": prerequisite_titles[parent], "mastered": parent in mastered} for parent in prerequisite_chain],
            "ready": all(parent in mastered for parent in parents),
            "passed_checks": progress.passed_checks if progress else [], "mastered": bool(progress and progress.mastered)}


@router.post("/lessons/{lesson_id}/checks/{check_index}")
def check_lesson(lesson_id: str, check_index: int, body: CheckAnswer, session: Session = Depends(get_session), user_id: str = Depends(require_student)):
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Unknown lesson")
    parents = session.scalars(select(LessonPrerequisite.prerequisite_id).where(LessonPrerequisite.lesson_id == lesson_id)).all()
    mastered = _mastered(session, user_id)
    if any(parent not in mastered for parent in parents):
        raise HTTPException(409, "Complete the prerequisite lessons first")
    checks = lesson.content["checks"]
    if not 0 <= check_index < len(checks):
        raise HTTPException(404, "Unknown check")
    check = checks[check_index]
    if body.answer >= len(check["choices"]):
        raise HTTPException(422, "Answer is outside the choices")
    correct = body.answer == check["answer"]
    progress = session.get(LessonProgress, (user_id, lesson_id)) or LessonProgress(user_id=user_id, lesson_id=lesson_id, passed_checks=[])
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
