"""Sync authored lessons and a checked prerequisite DAG into normalized tables."""

from pathlib import Path

import yaml
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.lesson_schema import LearningPaths
from app.models import ChallengePrerequisite, LearningModule, Lesson, LessonPrerequisite, Question


def read_learning_paths(path: Path) -> LearningPaths:
    data = LearningPaths.model_validate(yaml.safe_load(path.read_text()))
    lessons = {lesson.id for module in data.modules for lesson in module.lessons}
    if len(lessons) != sum(len(module.lessons) for module in data.modules):
        raise ValueError("duplicate lesson id in learning paths")
    module_ids = [module.id for module in data.modules]
    if len(module_ids) != len(set(module_ids)):
        raise ValueError("duplicate module id in learning paths")
    graph = {}
    for module in data.modules:
        for lesson in module.lessons:
            missing = set(lesson.prerequisites) - lessons
            if missing:
                raise ValueError(f"{lesson.id}: unknown prerequisites {sorted(missing)}")
            graph[lesson.id] = lesson.prerequisites
    seen: set[str] = set()
    visiting: set[str] = set()

    def visit(node: str) -> None:
        if node in visiting:
            raise ValueError(f"cycle in lesson prerequisites at {node}")
        if node in seen:
            return
        visiting.add(node)
        for parent in graph[node]:
            visit(parent)
        visiting.remove(node)
        seen.add(node)

    for node in graph:
        visit(node)
    for mapping in data.challenges:
        missing = set(mapping.requires) - lessons
        if missing:
            raise ValueError(f"{mapping.slug}: unknown lesson prerequisites {sorted(missing)}")
    return data


def sync_learning_paths(session: Session, content_dir: Path) -> None:
    path = content_dir / "learning_paths.yaml"
    if not path.exists():
        return
    data = read_learning_paths(path)
    for definition in data.modules:
        module = session.get(LearningModule, definition.id) or LearningModule(id=definition.id)
        module.citadel_id = definition.citadel_id
        module.title = definition.title
        module.summary = definition.summary
        module.position = definition.position
        module.cue_card = definition.cue_card.model_dump()
        session.add(module)
        for item in definition.lessons:
            lesson = session.get(Lesson, item.id) or Lesson(id=item.id)
            lesson.module_id = module.id
            lesson.title = item.title
            lesson.summary = item.summary
            lesson.position = item.position
            lesson.content = item.content.model_dump()
            session.add(lesson)
    session.flush()
    # The manifest owns graph edges. Progress rows are never removed or rewritten.
    session.execute(delete(LessonPrerequisite))
    session.execute(delete(ChallengePrerequisite))
    for definition in data.modules:
        for item in definition.lessons:
            for parent in item.prerequisites:
                session.add(LessonPrerequisite(lesson_id=item.id, prerequisite_id=parent))
    known_questions = set(session.scalars(select(Question.slug)))
    for item in data.challenges:
        if item.slug not in known_questions:
            raise ValueError(f"unknown challenge slug in learning paths: {item.slug}")
        for required in item.requires:
            session.add(ChallengePrerequisite(question_slug=item.slug, lesson_id=required))
    session.commit()
