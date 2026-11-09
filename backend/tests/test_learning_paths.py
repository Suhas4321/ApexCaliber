"""The authored pilot should teach and gate practice without changing challenge progress."""

import json
from collections import Counter
from copy import deepcopy
from pathlib import Path

import pytest
import yaml

from app.services.learning_paths import read_learning_paths


LESSON_CHECKS = {
    lesson["id"]: lesson["content"]["checks"]
    for module in yaml.safe_load((Path(__file__).resolve().parents[2] / "content" / "learning_paths.yaml").read_text())["modules"]
    for lesson in module["lessons"]
}


def correct_answer(lesson_id, check_index):
    return LESSON_CHECKS[lesson_id][check_index]["answer"]


def test_os_foundations_unlock_in_order_and_backup_mastery(client, backup_dir):
    path = client.get("/api/learning-paths/os_concurrency")
    assert path.status_code == 200
    lessons = path.json()["modules"][0]["lessons"]
    assert [item["id"] for item in lessons] == ["os-process", "os-thread", "os-race", "os-mutex"]
    assert lessons[0]["ready"] and not lessons[1]["ready"]
    assert path.json()["modules"][0]["cue_card"] is None
    assert {item["slug"] for item in path.json()["modules"][0]["practice_challenges"]} == {
        "memory-isolation-threads-vs-processes", "deterministic-interleaving-counter",
        "mutex-protected-counter", "processes-vs-threads-memory",
    }

    challenge = client.get("/api/questions/memory-isolation-threads-vs-processes").json()
    assert [item["id"] for item in challenge["required_lessons"]] == ["os-process", "os-thread"]
    assert all(not item["mastered"] for item in challenge["required_lessons"])
    assert client.post("/api/questions/memory-isolation-threads-vs-processes/run", json={"code": "pass"}).status_code == 409

    first = client.get("/api/lessons/os-process").json()
    assert "answer" not in first["content"]["checks"][0]
    assert client.post("/api/lessons/os-thread/checks/0", json={"answer": 0}).status_code == 409
    wrong = client.post("/api/lessons/os-process/checks/0", json={"answer": (correct_answer("os-process", 0) + 1) % 3}).json()
    assert not wrong["correct"] and not wrong["mastered"]
    assert client.post("/api/lessons/os-process/checks/0", json={"answer": correct_answer("os-process", 0)}).json()["passed_checks"] == [0]
    completed = client.post("/api/lessons/os-process/checks/1", json={"answer": correct_answer("os-process", 1)}).json()
    assert completed["mastered"]
    assert client.get("/api/lessons/os-thread").json()["ready"]
    assert [item["mastered"] for item in client.get("/api/questions/memory-isolation-threads-vs-processes").json()["required_lessons"]] == [True, False]
    assert client.get("/api/questions/mutex-protected-counter").json()["required_lessons"][-1]["id"] == "os-mutex"
    assert len(client.get("/api/lessons/os-race").json()["content"]["visual"]["tracks"]) == 2

    summary = client.get("/api/learning-paths/summary").json()
    assert summary["concepts_mastered"] >= 1
    assert summary["total_concepts"] == 30
    assert "challenges_solved" in summary
    saved = json.loads((backup_dir / "user_data.json").read_text())
    assert any(row["lesson_id"] == "os-process" and row["mastered"] for row in saved["tables"]["lesson_progress"])

    for lesson_id in ("os-thread", "os-race", "os-mutex"):
        for check_index in (0, 1):
            result = client.post(f"/api/lessons/{lesson_id}/checks/{check_index}", json={"answer": correct_answer(lesson_id, check_index)})
            assert result.status_code == 200
            assert result.json()["correct"]
    completed_module = client.get("/api/learning-paths/os_concurrency").json()["modules"][0]
    assert completed_module["completed"]
    assert len(completed_module["cue_card"]["pillars"]) == 4
    assert completed_module["cue_card"]["candidate_trap"]
    assert all(item["mastered"] for item in client.get("/api/questions/mutex-protected-counter").json()["required_lessons"])


def test_challenge_and_deep_link_start_at_first_available_os_idea(client):
    required = client.get("/api/questions/mutex-protected-counter").json()["required_lessons"]
    assert [item["id"] for item in required] == ["os-process", "os-thread", "os-race", "os-mutex"]
    assert [item["id"] for item in client.get("/api/lessons/os-mutex").json()["prerequisite_details"]] == [
        "os-process", "os-thread", "os-race"
    ]


def test_db_path_starts_with_tables_not_joins(client):
    path = client.get("/api/learning-paths/sql_dbms").json()
    lessons = path["modules"][0]["lessons"]
    assert [item["id"] for item in lessons] == ["db-table", "db-key", "db-join", "db-transaction"]
    assert lessons[0]["ready"] and not lessons[2]["ready"]
    assert client.get("/api/lessons/db-table").json()["content"]["worked_example"]
    assert len(client.get("/api/lessons/db-join").json()["content"]["visual"]["tracks"]) == 2


def test_every_lesson_has_an_authored_transfer_prompt(client):
    for citadel in ("os_concurrency", "sql_dbms", "computer_networking", "backend_apis", "python_data", "ai_resume"):
        path = client.get(f"/api/learning-paths/{citadel}")
        assert path.status_code == 200
        for module in path.json()["modules"]:
            for step in module["lessons"]:
                content = client.get(f"/api/lessons/{step['id']}").json()["content"]
                assert content["second_example_prompt"].strip()
                assert content["second_example"].strip()
                assert all("answer" not in check for check in content["checks"])


def test_check_answers_are_not_concentrated_in_the_first_choice():
    positions = Counter(check["answer"] for checks in LESSON_CHECKS.values() for check in checks)
    assert max(positions.values()) - min(positions.values()) <= 3


def test_extended_paths_begin_with_foundations_and_gate_advanced_challenges(client):
    os_modules = client.get("/api/learning-paths/os_concurrency").json()["modules"]
    assert [module["id"] for module in os_modules] == ["os-foundations", "os-systems", "os-coordination-and-io"]
    assert [lesson["id"] for lesson in os_modules[1]["lessons"]] == [
        "os-scheduling", "os-virtual-memory", "os-deadlock"
    ]
    assert os_modules[1]["lessons"][0]["prerequisites"] == ["os-process"]

    network = client.get("/api/learning-paths/computer_networking").json()["modules"][0]
    assert [lesson["id"] for lesson in network["lessons"]] == [
        "net-client-server", "net-address-port", "net-dns", "net-transport", "net-handshake"
    ]
    assert network["lessons"][0]["ready"]
    assert not network["lessons"][1]["ready"]
    assert network["lessons"][2]["prerequisites"] == ["net-address-port"]
    assert client.get("/api/questions/dns-recursive-resolver").json()["required_lessons"][-1]["id"] == "net-dns"
    assert [item["id"] for item in client.get("/api/questions/tcp-three-way-handshake").json()["required_lessons"]] == [
        "net-client-server", "net-address-port", "net-dns", "net-transport", "net-handshake"
    ]
    assert len(client.get("/api/lessons/net-handshake").json()["content"]["visual"]["tracks"]) == 2
    assert client.get("/api/questions/virtual-memory-page-replacement").json()["required_lessons"][-1]["id"] == "os-virtual-memory"
    assert client.get("/api/lessons/net-client-server").json()["content"]["checks"]
    backend_first = client.get("/api/learning-paths/backend_apis").json()["modules"][0]["lessons"][0]
    assert backend_first["prerequisite_details"] == [{"id": "net-client-server", "title": "What happens when you open a website?", "mastered": False}]


def test_coordination_and_storage_lessons_gate_matching_practice(client):
    os_modules = client.get("/api/learning-paths/os_concurrency").json()["modules"]
    assert os_modules[-1]["id"] == "os-coordination-and-io"
    assert [lesson["id"] for lesson in os_modules[-1]["lessons"]] == ["os-semaphore", "os-files", "os-async"]
    async_prereqs = set(os_modules[-1]["lessons"][-1]["prerequisites"])
    assert async_prereqs == {"os-scheduling", "os-thread", "os-files"}
    assert {"os-async", "os-semaphore"}.issubset({lesson["id"] for lesson in client.get("/api/questions/asyncio-event-loop-semaphore").json()["required_lessons"]})

    db_modules = client.get("/api/learning-paths/sql_dbms").json()["modules"]
    assert [lesson["id"] for lesson in db_modules[-1]["lessons"]] == ["db-normalization", "db-isolation", "db-pages"]
    assert client.get("/api/questions/heap-pages-and-scans").json()["required_lessons"][-1]["id"] == "db-pages"
    assert any(choice.startswith("No, PostgreSQL") for choice in client.get("/api/lessons/db-pages").json()["content"]["checks"][0]["choices"])
    assert len(client.get("/api/lessons/os-semaphore").json()["content"]["visual"]["tracks"]) == 2
    assert len(client.get("/api/lessons/db-pages").json()["content"]["visual"]["tracks"]) == 2


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
