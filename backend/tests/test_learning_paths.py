"""The authored pilot should teach and gate practice without changing challenge progress."""

import json
from copy import deepcopy
from pathlib import Path

import pytest
import yaml

from app.services.learning_paths import read_learning_paths


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
    assert len(client.get("/api/lessons/os-race").json()["content"]["visual"]["tracks"]) == 2

    summary = client.get("/api/learning-paths/summary").json()
    assert summary["concepts_mastered"] >= 1
    assert summary["total_concepts"] == 8
    assert "challenges_solved" in summary
    saved = json.loads((backup_dir / "user_data.json").read_text())
    assert any(row["lesson_id"] == "os-process" and row["mastered"] for row in saved["tables"]["lesson_progress"])

    for lesson_id in ("os-thread", "os-race", "os-mutex"):
        for check_index in (0, 1):
            result = client.post(f"/api/lessons/{lesson_id}/checks/{check_index}", json={"answer": 0})
            assert result.status_code == 200
            assert result.json()["correct"]
    completed_module = client.get("/api/learning-paths/os_concurrency").json()["modules"][0]
    assert completed_module["completed"]
    assert len(completed_module["cue_card"]["pillars"]) == 4
    assert completed_module["cue_card"]["candidate_trap"]


def test_db_path_starts_with_tables_not_joins(client):
    path = client.get("/api/learning-paths/sql_dbms").json()
    lessons = path["modules"][0]["lessons"]
    assert [item["id"] for item in lessons] == ["db-table", "db-key", "db-join", "db-transaction"]
    assert lessons[0]["ready"] and not lessons[2]["ready"]
    assert client.get("/api/lessons/db-table").json()["content"]["worked_example"]
    assert len(client.get("/api/lessons/db-join").json()["content"]["visual"]["tracks"]) == 2


def test_authoring_graph_rejects_cycles_and_duplicate_challenge_mappings(tmp_path):
    source = Path(__file__).resolve().parents[2] / "content" / "learning_paths.yaml"
    valid = yaml.safe_load(source.read_text())
    path = tmp_path / "learning_paths.yaml"

    cyclic = deepcopy(valid)
    cyclic["modules"][0]["lessons"][0]["prerequisites"] = ["os-mutex"]
    path.write_text(yaml.safe_dump(cyclic))
    with pytest.raises(ValueError, match="cycle"):
        read_learning_paths(path)

    duplicate = deepcopy(valid)
    duplicate["challenges"].append(deepcopy(duplicate["challenges"][0]))
    path.write_text(yaml.safe_dump(duplicate))
    with pytest.raises(ValueError, match="duplicate challenge mapping"):
        read_learning_paths(path)
