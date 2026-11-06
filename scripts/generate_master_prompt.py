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
lines.append("# 🏛️ ApexCaliber: Complete Curriculum Inventory, Pedagogical Problem & Frontier AI Master Research Brief\n")
lines.append("> **Prompt Persona & Mandate for the AI:** You are an elite Principal Software Architect, FAANG SDE Bar Raiser, and Master Educational Technologist (combining the pedagogical micro-interactions of Brilliant.org, the architectural clarity of ByteByteGo, and the interactive polish of Stripe).\n")
lines.append("> The founder of **ApexCaliber** has provided the complete system architecture, the entire 198-question curriculum inventory, and their exact pedagogical intent below.\n")
lines.append("> Your mission: Conduct deep industry research into modern Tier-1 SDE interview patterns, audit every question and world in the platform, and deliver an exhaustive, step-by-step master plan to transform ApexCaliber into the world's most engaging, interactive, and joyful Computer Science academy.\n")
lines.append("---\n")

lines.append("## Part 1: What is ApexCaliber?\n")
lines.append("**ApexCaliber** is an interactive, full-stack Computer Science and Software Engineering learning platform and library.")
lines.append("- **Backend:** FastAPI, Python 3.14, SQLAlchemy, SQLite/PostgreSQL, dynamic code execution runners (`python_trace`, `python_practical`, `sql_sqlite`).")
lines.append("- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Monaco Code Editor, Framer Motion, custom CSS-3D / Canvas / SVG visualizers.")
lines.append("- **Current Scale:** 7 Core Citadels, 42 Worlds, 198 Modules/Questions.\n")
lines.append("---\n")

lines.append("## Part 2: The Core Problem & The Founder's Vision\n")
lines.append("### The Historical Flaw: The 'LeetCode Trap' in Systems Topics")
lines.append("ApexCaliber started with an algorithm practice runner. Because of that legacy structure, **every single non-DSA topic (DBMS, OS, Backend APIs, Networking, GenAI, Python Internals) was accidentally packaged like a LeetCode coding problem!**\n")
lines.append("For example:")
lines.append("- A student clicks on **'HTTP Status Codes'** (Citadel V).")
lines.append("- Instead of being taught what HTTP is, what a client/server is, what network latency is, or how Swiggy handles 504 timeouts, they are dumped into a **split-screen LeetCode coding editor** with an empty Python stub:")
lines.append("  ```python\n  def handle_status(code: int) -> str:\n      # Write code to pass 3 test cases...\n  ```")
lines.append("- If the student has never built a backend, **how can they possibly do this?** They are forced to memorize syntax and copy-paste trivia `if-else` branches. They learn *nothing* about real engineering.\n")

lines.append("### The Founder's Non-Negotiable Intent & Philosophy")
lines.append("1. **Teaching & Intuitive Understanding is Priority #1 (NOT Coding First):**")
lines.append("   - **Citadel I (DSA Apex Mastery) remains code-first**, because algorithms are coding puzzles.")
lines.append("   - **Citadels II through VII (Systems, DBMS, OS, Backend, Networking, GenAI) MUST BE TEACHING-FIRST.**")
lines.append("   - Students must understand the concept down to their bones before writing or inspecting any code.")
lines.append("2. **The 'Knowledge Tree' / Organic Stage Progression:**")
lines.append("   - Concepts must never be thrown at the user as isolated trivia. They must feel like an interconnected **journey**.")
lines.append("   - Start from foundational building blocks (what something is, why it exists, elementary primitives).")
lines.append("   - Progressively branch into interconnected mechanisms.")
lines.append("   - Culminate in the apex root concept (how real-world systems, product flows, and large-scale architectures work).")
lines.append("   - **Crucial Rule:** The progression is **NOT a rigid 3-box limit**. It must adapt organically to what each specific topic requires (some topics have 2 stages, others 4 or 5 progressive layers). Adapt the progression dynamically to fit the topic's natural cognitive learning curve!")
lines.append("3. **Joyful, Gamified & Attention-Grabbing (Anti-Boring Notes):**")
lines.append("   - No dry, academic walls of text (like traditional GeeksforGeeks or wikis).")
lines.append("   - **Interactive Micro-Experiments:** Buttons to spam requests and trigger `429 Too Many Requests`, sliders to adjust latency and trigger `504 Gateway Timeout`, toggle failure modes.")
lines.append("   - **'Feel the Pain' Broken Demos:** Show why a technology exists by letting students see the failure first (e.g., watch a database crash under 100 simultaneous queries before introducing Redis Mutex locks).")
lines.append("   - **Real Product Stories:** Connect every topic to Swiggy, Zomato, Zerodha, Razorpay, Netflix, Hotstar, Instagram, Flipkart.")
lines.append("4. **Pre-Wired, Ready-to-Run Code Sandboxes (Instead of Empty Homework):**")
lines.append("   - In non-DSA topics, do not force students to write boilerplate classes from scratch.")
lines.append("   - Provide a pre-wired, fully functioning interactive lab where students tweak parameters, run live experiments, and inspect real telemetry.\n")
lines.append("---\n")

lines.append("## Part 3: Complete Curriculum & Question Inventory (Ground Truth)\n")
for cid, c_obj in citadels.items():
    ws = worlds_by_citadel.get(cid, [])
    q_count = sum(len(w.get("questions", [])) for w in ws)
    lines.append(f"### 🏰 Citadel {c_obj['numeral']}: {c_obj['name']} (`{cid}`)")
    lines.append(f"*{c_obj.get('tagline', '')} · {len(ws)} Worlds · {q_count} Questions*")
    lines.append(f"> **Citadel Description:** {c_obj.get('description', '')}\n")
    lines.append(f"> **Pedagogical Mode:** {'Code-First Algorithmic Puzzle Practice' if cid == 'dsa' else 'TEACHING-FIRST Interactive Guided Journey & Pre-Wired Lab'}\n")

    for w in ws:
        qs = w.get("questions", [])
        lines.append(f"#### World {w['id']}: {w['name']} (Slug: `{w['slug']}`)")
        lines.append(f"*{len(qs)} questions · Default Visualizer: `{w.get('visualizer', 'none')}`*")
        lines.append("| LC # | Title | Slug | Visualizer | Runner |")
        lines.append("| :--- | :--- | :--- | :--- | :--- |")
        for q in qs:
            lines.append(f"| {q.get('lc', '—')} | {q.get('title')} | `{q.get('slug')}` | `{q.get('visualizer')}` | `{q.get('runner_type', 'python_trace')}` |")
        lines.append("")
    lines.append("---\n")

lines.append("## Part 4: What You (The Frontier AI) Must Research & Deliver\n")
lines.append("Perform exhaustive research and produce a comprehensive, structured master plan covering the following 5 parts:\n")
lines.append("### 1. Real-World SDE Interview & Industry Skill Audit")
lines.append("- Research what Tier-1 tech giants (Google, Meta, Amazon, Stripe, Uber) and high-growth engineering startups (Zerodha, Razorpay, Swiggy) actually ask SDE-1 and SDE-2 candidates.")
lines.append("- Audit the 198 questions above against those requirements. Detail what is missing, what is shallow, and what needs deeper practical focus.\n")
lines.append("### 2. Citadel-by-Citadel Knowledge Journey Framework")
lines.append("- Design the organic, multi-stage learning progression for every non-DSA Citadel (II through VII).")
lines.append("- Show how elementary building blocks connect into mechanisms and synthesize into real production architectures without forcing an arbitrary 3-stage limit.\n")
lines.append("### 3. Concrete Topic Teaching Blueprints")
lines.append("- For representative topics (e.g. HTTP Status Codes, Redis Cache-Aside & Stampede, DNS Resolution, TCP Handshake, Virtual Memory Paging, Deadlock Detection, Rate Limiting):")
lines.append("  - **The Hook / Product Story:** Real production context (e.g., UPI double-debit, Netflix streaming stutter).")
lines.append("  - **The Interactive Micro-Experiment:** Specific sliders, click-to-spam buttons, or dials.")
lines.append("  - **The Visual Diagram Archetype:** Where to use dbdiagram.io relational schemas, animated packet flows (ByteByteGo style), 3D isometric hardware stages, or Excalidraw-style chalkboard diagrams.")
lines.append("  - **The Pre-Wired Sandbox:** The exact runnable code with adjustable parameters for live experimentation.\n")
lines.append("### 4. Frontend UI/UX Redesign Specifications")
lines.append("- Specify how `QuestionPage.tsx` must branch: Citadel I (DSA) stays code-first; Citadels II–VII land directly on the **Interactive Concept Journey**.")
lines.append("- Detail the header journey progression bar and how the code editor becomes an optional, pre-loaded **Interactive Lab** tab.\n")
lines.append("### 5. Phased Implementation Roadmap")
lines.append("- Provide a prioritized, step-by-step engineering roadmap to update schemas, generate interactive content, and deploy the new learning experience.")

content_out = "\n".join(lines)
out_file = Path("APEXCALIBER_MASTER_RESEARCH_AND_CURRICULUM_PROMPT.md")
with open(out_file, "w") as f:
    f.write(content_out)

print(f"Successfully generated {out_file} ({len(content_out)} chars, {len(lines)} lines).")
