import json
from pathlib import Path

curriculum_path = Path("content/curriculum.json")
with open(curriculum_path) as f:
    c = json.load(f)

citadels = {c_obj["id"]: c_obj for c_obj in c["citadels"]}
worlds_by_citadel = {}
for w in c["worlds"]:
    cid = w.get("citadel_id", "unknown")
    worlds_by_citadel.setdefault(cid, []).append(w)

lines = []
lines.append("# Master Blueprint Expansion: Full Pedagogical Architecture Across ALL Non-DSA Citadels\n")
lines.append("Principal Architect, your RFC for World 17 was a masterpiece. The normalized trace event contract, the 7-stage POE state machine, and the Dual-Engine (Mode A + Mode B) architecture are now adopted as the foundational standard for ApexCaliber.\n")
lines.append("Now, the founder and our lead implementation engineer (Antigravity) need you to execute this exact same level of architectural and pedagogical depth across **ALL REMAINING NON-DSA CITADELS (Citadels II through VII)**.\n")
lines.append("Do not leave any citadel behind. We have 30 non-DSA worlds across 6 engineering pillars. Here is our exact curriculum inventory that you must design for:\n")
lines.append("---\n")

for cid in ["python_data", "sql_dbms", "os_concurrency", "backend_apis", "ai_resume", "computer_networking"]:
    c_obj = citadels.get(cid)
    if not c_obj:
        continue
    ws = worlds_by_citadel.get(cid, [])
    lines.append(f"## Citadel {c_obj['numeral']}: {c_obj['name']} (`{cid}`)")
    lines.append(f"*{c_obj.get('description', '')}*\n")
    for w in ws:
        qs = w.get("questions", [])
        lines.append(f"### World {w['id']}: {w['name']} (Slug: `{w['slug']}`)")
        lines.append(f"- **Current Visualizer:** `{w.get('visualizer', 'custom')}`")
        lines.append("- **Questions in World:**")
        for q in qs:
            lines.append(f"  - `{q.get('slug')}` — **{q.get('title')}** (LC #{q.get('lc', '—')}, Runner: `{q.get('runner_type', 'python_trace')}`)")
        lines.append("")
    lines.append("---\n")

lines.append("## Your Mandate for ALL Citadels:\n")
lines.append("For each Citadel (II through VII), break down its worlds and provide the concrete engineering specifications:\n")
lines.append("1. **The Organic Knowledge Progression:** Outline the natural stage sequence for each world (remember: stage count is dynamic, matching the topic's cognitive difficulty, not an arbitrary 3-tier box).\n")
lines.append("2. **The Real-World Product Anchors:** Anchor every single world to a high-stakes production incident or tech company (e.g., Zerodha order book race conditions, Hotstar 50M concurrent stream caching, Razorpay webhook idempotency, Blinkit 10-minute delivery routing, OpenAI token budget overruns).\n")
lines.append("3. **The Core Misconception & POE Specification:**")
lines.append("   - What is the #1 mental model trap students fall into?")
lines.append("   - Give the exact **Predict** question + 3 choices (with misconceptions attached).")
lines.append("   - Define the **Interactive Control** (slider, toggle, chaos injector) and the **Observe** outcome.\n")
lines.append("4. **The Visualizer Archetype & Simulation Model:**")
lines.append("   - Which visualizer archetype does this world use? (e.g., `cache_relational`, `network_flow`, `memory_view`, `concurrency_timeline`, `system_blueprint`, or new specialized visualizer).")
lines.append("   - How does the Mode A Deterministic Simulator transition its states into our Normalized Event Stream?\n")
lines.append("5. **The Pre-Wired Lab Blueprint:**")
lines.append("   - What pre-loaded Python/SQL/FastAPI code is given to the student so they can immediately experiment with dials and metrics rather than writing empty homework boilerplate?\n")
lines.append("Provide the exhaustive plan for each citadel systematically. Let's make every single topic in ApexCaliber an unforgettable, joyful masterclass.")

content_out = "\n".join(lines)
out_file = Path("APEXCALIBER_ALL_CITADELS_RESEARCH_PROMPT.md")
with open(out_file, "w") as f:
    f.write(content_out)

print(f"Successfully generated {out_file} ({len(content_out)} chars, {len(lines)} lines).")
