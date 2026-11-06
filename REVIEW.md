# PatternForge DSA — Project Review

**Reviewed:** 6 Nov 2026 · branch `feat/plasma-violet-theme` (16 uncommitted files)
**Scope:** backend, frontend, lesson content, docs, repo hygiene
**Method:** three parallel reviewers + independent verification of every Critical/Major claim below

---

## Verdict

A genuinely impressive personal project with an unusually strong content corpus and a well-built
frontend. It is **not** ready to be shared, deployed, or put on a CV in its current state — not
because the code is bad, but because of **three security holes in the code runner**, **two silent
data-loss paths**, and a **documentation layer three expansions out of date**. All of these are
fixable in a focused day or two.

| Area | Grade | One-line summary |
|---|---|---|
| Lesson content | **A−** | 198 YAMLs, all parse, all have tests + solution + 3 drills + 3 hints. Best asset. |
| Frontend | **B+** | Strict TS, clean effects, offline Monaco, no Criticals. Dead code + fetch races. |
| Backend core | **B** | SQLAlchemy ORM, no SQLi, atomic backups, 32/32 tests pass. Solid bones. |
| Code runner | **D** | Three escape paths. The word "sandbox" is used where no sandbox exists. |
| Data safety | **C−** | Restore silently truncates and can fire from any web page. |
| Docs | **D+** | README says 115 questions / 12 worlds. Reality is 198 / 42. |
| Repo hygiene | **C** | Live personal data tracked in a public repo. No secrets leaked, though. |

**Verified good news:** `pytest` really does pass — **32/32 in 16.85s**. No secrets were ever
committed (scanned all 451 tracked files). CORS does not reflect arbitrary origins. No SQL
injection surface. The README's "not a security sandbox" caveat is honest — it's the rest of the
codebase that contradicts it.

---

## Fix first — P0: the code runner is not contained

The README says "it is not a security sandbox: only run code you wrote." That is honest, but three
findings mean it isn't a *local-only* problem:

**C1 · `python_trace` AST gate is bypassable in two lines.**
`backend/app/runner/harness.py:643-666` only rejects *literal* forms — `import X`, `x.__globals__`,
`eval(...)`. It never inspects string arguments. This payload passed the gate cleanly
(`compile_error: None`) and returned `suhas | /tmp/tmp9iewqxi2`:

```python
def probe(n):
    b = getattr(probe, "__globals__")["__builtins__"]   # getattr() + subscript: invisible to the walk
    for c in b["getattr"](b["object"], "__subclasses__")():
        fg = b["getattr"](c.__init__, "__globals__")
        if "sys" in fg:
            return fg["sys"].modules["os"].popen("id -un").read().strip()
```

The denylist also contains a typo — `" credits"` with a leading space (`harness.py:630`) — which is
the failure mode of every hand-maintained denylist.

**C2 · `python_practical` leaks the parent environment, API keys included.**
`backend/app/runner/practical_runner.py:396-402` calls `Popen` with **no `env=` and no `-I`**, unlike
the trace runner (`python_runner.py:90-97`) which does both. And `os` is deliberately absent from
`PRACTICAL_FORBIDDEN_MODULES` (`:25-28`), so `import os` passes by design. Confirmed with canaries in
the parent env: `AIKEY=SUPERSECRET_CANARY|KEYS=AI_API_KEY,GEMINI_API_KEY,...`, and
`os.popen("id -un")` → `suhas`. This path is reachable from **68 lesson files** declaring
`runner_type: python_practical`, and sets no `RLIMIT_FSIZE`/`RLIMIT_NOFILE` with a 2 GB `RLIMIT_AS`.

> **Fix (both):** add `env={"PATH": "/usr/bin:/bin"}` and `-I` to the practical `Popen`, add `os` to
> the denylist, and **remove the word "sandbox" from every user-facing string**. `SecurityError` at
> `harness.py:662` currently tells users they hit a sandbox — which is exactly the false belief these
> findings falsify. If real containment is wanted, it's a separate uid + `bubblewrap`/`nsjail`, not an
> AST walk. Rename `validate_ast_safety` → `reject_obvious_mistakes`.

**C3 · `POST /api/backup/restore` is a bodyless POST → CSRF-able silent wipe.**
`backend/app/routers/backup.py:32-40` takes no body, and restore **deletes every user row first**
(`backup_manager.py:107`) before reinserting. A bodyless `text/plain` POST is a CORS "simple
request" — no preflight — so any page the user visits can fire it. Confirmed: `POST
/api/backup/dump` from `Origin: https://evil.example` returned **200** and wrote the file; same for
`/api/content/reload`.

> **Fix:** require a JSON body (`{"confirm": true}`) so the request must preflight, and check
> `Origin` against `settings.cors_origins`.

## Fix second — P1: silent data loss

**M1 · Restore truncates submissions to 500 and *permanently deletes* the rest.**
`backup_manager.py:53,59-63` selects `.limit(MAX_BACKUP_SUBMISSIONS)` — and the comment above it at
`:60` claims "plus at least all passing submissions", which the code does not do. Restore then wipes
all submissions (`:107`) and reinserts only those 500. Dump→restore is a lossy round trip with no
warning.

**M2 · Auto-restore-on-start can clobber a good DB.**
`main.py:37-44` fires when `count(progress) == 0`. Point `DATABASE_URL` at a new Postgres project, or
delete the SQLite file, and the oldest backup is applied over it — replacing drafts, submissions and
pitch notes, with no `exported_at` freshness check and no pre-restore snapshot. Unrecoverable.

> **Fix:** only auto-restore when the backup is newer than the DB mtime; write `pre_restore.json`
> first; make `import_user_data` refuse to delete rows absent from the dump.

## Fix third — P1: 83 of 198 questions link to LeetCode problems that don't exist

83 questions carry `lc` values in the **9010–9702** range (all 82 lessons in worlds 13–42, plus
`bubble-sort`). LeetCode's highest real problem number is ~4,086, so these are fabricated. Verified
count: **165 fabricated `lc` values** total (83 question-level + 82 twist-level), out of 198 files.

This is user-visible, not cosmetic: `progress_service.py:11`, `WorldCheatSheet.tsx:191` and
`InterviewAnswerPlaybook.tsx:37` all build `https://leetcode.com/problems/{slug}/`. For
`redis-cache-aside-strategy` that's a 404 behind a LeetCode-styled badge reading "#9311" — implying a
problem that doesn't exist.

> **Fix:** make `lc` nullable, add `source: app` for non-LeetCode lessons, suppress the badge when
> null. Where a real analog exists, map to it (the SQL lesson's own prose already cites LC 176).

## Then — Major

| # | Finding | Evidence |
|---|---|---|
| M3 | No schema versioning; migrations are two hardcoded `ALTER TABLE`s in a bare `except Exception: log.warning` | `main.py:26-32` |
| M4 | `GET /api/activity?days=999999999` → unhandled `OverflowError` → 500. `days=-5` silently returns empty | `worlds.py:137-139` — add `Query(371, ge=1, le=3650)` |
| M5 | Every code run re-serializes the *entire* dataset to JSON on the request thread | `questions.py:145` → `auto_dump` |
| M6 | Frontend fetches race on navigation — slow response for Q_A lands under Q_B's URL, then autosaves A's code into B's draft. Reachable via the headline Ctrl+K flow | `QuestionPage.tsx:66-96`, `useDraft.ts:17-28` |
| M7 | ~2,283 lines of dead components (zero importers) from the superseded StageArena flow | 9 files incl. `StageArena.tsx` (867), `LeftRailStepper.tsx` (346) |
| M8 | Frontend tests can never run — hand-rolled `assert`, no runner in devDeps, no `test` script | `src/lib/narrator/__tests__/` |
| M9 | `CONTENT_GUIDE.md` documents a schema 41% of content has outgrown (3 runner variants, 5 undocumented keys); its "6–9 tests" bar is violated by 81 files | `docs/CONTENT_GUIDE.md` |
| M10 | Live personal data tracked in a **public** GitHub repo — 46 submissions, drafts, pitch notes, touched in 7 commits, and the app re-dirties it on every change | `backend/backups/user_data.json`, `origin → github.com/Suhas4321/PatternForge-DSA` |

## Minor (worth a cleanup pass)

- No `PRAGMA busy_timeout` → concurrent `/run` + `/progress` can 500 with "database is locked" (`db.py:17-25`)
- `get_or_create_progress` is check-then-insert → concurrent PK conflict (`progress_service.py:14-19`)
- `_DEMO_TRACE_CACHE` unbounded and never cleared on `/content/reload` (`questions.py:247`)
- AI coach: no retry/backoff/rate limit, and forwards `resp.text[:300]` from the provider to the client (`ai_coach.py:117-128`)
- No fetch timeout in the API client — a hung backend spins forever (`client.ts:13-33`)
- `Alt+1`–`Alt+4` shortcuts documented in README **do not exist**; the only Alt handler is in dead code
- README/DESIGN_REFERENCES say `studio-contrast` is the default theme; toggle can only ever set `light`/`dark`, so those themes are unreachable except via `?theme=`
- Branding mismatch: README says "PatternForge", `index.html:8` titles it "ApexCaliber"
- `chunkSizeWarningLimit: 4000` masks a 2.7 MB CodeEditor chunk (`vite.config.ts:6`)
- 15 YAMLs sit outside their declared world folder, silently rescued by a glob fallback (`content_loader.py:32-34`); worlds 29/30/34/38 are `status: live` with no directory

## Docs & repo hygiene

Every top-level doc disagrees on the question count — **115** (README, SPEC, BUILD_TRACKER,
CITADEL_MASTER_SPEC) vs **154** (BUILD_TRACKER Phase F, which also contradicts its own Milestone 4)
vs **193** (PLAN.md, matches HEAD) vs the actual **198** in the tree.

Recommended consolidation — **keep 3, merge 2, retire 2**:

- **Keep** `README.md` as the entry point (after fixing counts, theme wording, LeetCode claim)
- **Keep** `docs/SPEC.md`, absorbing the citadel reality (7 citadels, 42 worlds, 3 runner types)
- **Keep** `BUILD_TRACKER.md` as the milestone log, appending the missing Citadel VII phase
- **Merge** `MASTER_PLAN.md` + `SYSTEM_DESIGN_PLAN.md` into one architecture/UI plan
- **Retire** `PLAN.md` (point-in-time; move its health scorecard into README)
- **Retire** `DESIGN_AND_CURRICULUM_PLAN.md` (superseded; salvage its reference catalog)

On `MASTER_PLAN.md`'s shadcn overhaul: **the plan is stale in the opposite direction from what you'd
expect.** Its branch exists and is merged, but contains zero shadcn work. Meanwhile its main UX goals
are already met with hand-rolled code — the 3-step flow is live, the resizable split-pane IDE exists,
Ctrl+K works, border-beam/magic-card are in `effects.tsx`. Importing shadcn now would *duplicate* the
existing `ui.tsx`/`effects.tsx`/`vendor/` kit. **Re-scope the plan rather than execute it as written.**

Also: `./run.sh test` is not usable as a pre-commit gate. pytest takes 17s, then
`validate_content.py` spawns a fresh subprocess per question × (solution + brute force + starter +
every drill) — extrapolated **~55–60 minutes**, and block-buffered so piped output shows nothing for
the first several minutes. Add `-u`, parallelize, and split it into `run.sh test` (fast) and
`run.sh validate` (slow).

---

## Suggested order of work

1. **Today** — the three security fixes (C1 env/`-I`, C2 denylist, C3 require body). All are a few lines each.
2. **This week** — data-loss guards (M1, M2), the `days` bound (M4), and untrack `user_data.json` (M10).
3. **Then** — `lc` nullable + badge suppression (83 dead links), fix M6 fetch races.
4. **Cleanup** — delete the 2,283 lines of dead frontend code, consolidate docs, correct the README counts.
5. **Only then** — re-scope `MASTER_PLAN.md` before building anything from it.

A note on framing: the two things that will impress a reviewer of this repo — 198 hand-authored
lessons and a clean strict-TS frontend — are currently buried under a README that undersells them
(115/12) and next to a "sandbox" claim the code can't back. Fixing the claims is as valuable as
fixing the code.
