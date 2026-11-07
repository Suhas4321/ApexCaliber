"""The authored pilot should teach and gate practice without changing challenge progress."""

import json


def test_os_foundations_unlock_in_order_and_backup_mastery(client, backup_dir):
    path = client.get("/api/learning-paths/os_concurrency")
    assert path.status_code == 200
    lessons = path.json()["modules"][0]["lessons"]
    assert [item["id"] for item in lessons] == ["os-process", "os-thread", "os-race", "os-mutex"]
    assert lessons[0]["ready"] and not lessons[1]["ready"]
    assert path.json()["modules"][0]["cue_card"] is None

    challenge = client.get("/api/questions/memory-isolation-threads-vs-processes").json()
    assert challenge["required_lessons"] == [{"id": "os-thread", "title": "What is a thread?", "mastered": False}]
    assert client.post("/api/questions/memory-isolation-threads-vs-processes/run", json={"code": "pass"}).status_code == 409

    first = client.get("/api/lessons/os-process").json()
    assert "answer" not in first["content"]["checks"][0]
    assert client.post("/api/lessons/os-thread/checks/0", json={"answer": 0}).status_code == 409
    wrong = client.post("/api/lessons/os-process/checks/0", json={"answer": 1}).json()
    assert not wrong["correct"] and not wrong["mastered"]
    assert client.post("/api/lessons/os-process/checks/0", json={"answer": 0}).json()["passed_checks"] == [0]
    completed = client.post("/api/lessons/os-process/checks/1", json={"answer": 0}).json()
    assert completed["mastered"]
    assert client.get("/api/lessons/os-thread").json()["ready"]

    summary = client.get("/api/learning-paths/summary").json()
    assert summary["concepts_mastered"] >= 1
    assert summary["total_concepts"] == 8
    assert "challenges_solved" in summary
    saved = json.loads((backup_dir / "user_data.json").read_text())
    assert any(row["lesson_id"] == "os-process" and row["mastered"] for row in saved["tables"]["lesson_progress"])


def test_db_path_starts_with_tables_not_joins(client):
    path = client.get("/api/learning-paths/sql_dbms").json()
    lessons = path["modules"][0]["lessons"]
    assert [item["id"] for item in lessons] == ["db-table", "db-key", "db-join", "db-transaction"]
    assert lessons[0]["ready"] and not lessons[2]["ready"]
    assert client.get("/api/lessons/db-table").json()["content"]["worked_example"]
