"""Student data must never cross account boundaries."""

from datetime import timedelta
from uuid import uuid4

from app.auth import optional_student
from app.config import settings
from app.db import SessionLocal
from app.main import app
from app.models import Lesson, Progress, Submission, utcnow


def test_two_students_have_separate_progress_and_drafts(client):
    alice, bob = str(uuid4()), str(uuid4())
    slug = "contains-duplicate"

    def as_user(user_id):
        app.dependency_overrides[optional_student] = lambda: user_id

    try:
        as_user(alice)
        assert client.patch(f"/api/questions/{slug}/progress", json={"concept_done": True}).status_code == 200
        assert client.put(f"/api/questions/{slug}/draft", json={"target": "main", "code": "alice's private draft"}).status_code == 204
        assert client.post("/api/me/system-design/chat-system").status_code == 204
        with SessionLocal() as session:
            progress = session.get(Progress, (alice, slug))
            progress.solved = True
            progress.next_review_at = utcnow() - timedelta(days=1)
            session.add(Submission(user_id=alice, question_slug=slug, target="main", code="private", passed=True, passed_count=1, total_count=1))
            session.commit()
        alice_question = client.get(f"/api/questions/{slug}").json()
        assert alice_question["progress"]["concept_done"] is True
        assert alice_question["drafts"]["main"] == "alice's private draft"
        assert client.get('/api/stats').json()['total_solved'] >= 1
        assert any(item['slug'] == slug for item in client.get('/api/review').json()['due'])
        assert any(item['slug'] == slug for item in client.get('/api/activity').json()['events'])

        as_user(bob)
        bob_question = client.get(f"/api/questions/{slug}").json()
        assert bob_question["progress"]["concept_done"] is False
        assert bob_question["drafts"] == {}
        assert client.get("/api/me/system-design").json()["completed_ids"] == []
        assert client.get('/api/stats').json()['total_solved'] == 0
        assert client.get('/api/review').json()['due'] == []
        assert client.get('/api/activity').json()['events'] == []
        assert client.patch(f"/api/questions/{slug}/progress", json={"quiz_passed": True}).status_code == 200

        as_user(alice)
        alice_question = client.get(f"/api/questions/{slug}").json()
        assert alice_question["progress"]["concept_done"] is True
        assert alice_question["progress"]["quiz_passed"] is False
        assert client.get("/api/me/system-design").json()["completed_ids"] == ["chat-system"]
    finally:
        app.dependency_overrides.pop(optional_student, None)


def test_lesson_checks_and_anonymous_writes_are_isolated(client):
    alice, bob = str(uuid4()), str(uuid4())
    lesson_id = "os-process"
    with SessionLocal() as session:
        answer = session.get(Lesson, lesson_id).content["checks"][0]["answer"]

    try:
        app.dependency_overrides[optional_student] = lambda: alice
        result = client.post(f"/api/lessons/{lesson_id}/checks/0", json={"answer": answer})
        assert result.status_code == 200 and result.json()["correct"] is True
        assert client.get(f"/api/lessons/{lesson_id}").json()["passed_checks"] == [0]

        app.dependency_overrides[optional_student] = lambda: bob
        assert client.get(f"/api/lessons/{lesson_id}").json()["passed_checks"] == []

        app.dependency_overrides[optional_student] = lambda: None
        assert client.get(f"/api/lessons/{lesson_id}").status_code == 200
        assert client.post(f"/api/lessons/{lesson_id}/checks/0", json={"answer": answer}).status_code == 401
        assert client.post("/api/me/system-design/chat-system").status_code == 401
    finally:
        app.dependency_overrides.pop(optional_student, None)


def test_hosted_mode_disables_in_process_execution(client, monkeypatch):
    monkeypatch.setattr(settings, "app_mode", "hosted")
    app.dependency_overrides[optional_student] = lambda: str(uuid4())
    try:
        assert client.post("/api/playground/run", json={"code": "print(1)", "function_name": "f"}).status_code == 503
        assert client.post("/api/questions/two-sum/run", json={"code": "def twoSum(): pass"}).status_code == 503
        assert client.get("/api/questions/two-sum/demo-trace").status_code == 503
        assert client.post("/api/content/reload").status_code == 404
    finally:
        app.dependency_overrides.pop(optional_student, None)
