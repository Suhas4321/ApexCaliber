# Public launch and student accounts

**Status: architecture and release plan, not an implemented login system.** ApexCaliber currently works as a local, single-learner application. Do not put the current FastAPI server on a public address or treat the existing PostgreSQL option as multi-user support.

## Product decision

Let visitors browse the homepage, citadels, and concept lessons without an account. Ask them to sign in when they choose **Save my climb**, submit practice, write a draft, use the coach, or resume on another device. Keep their lesson and return path through the sign-in flow. This serves the beginner who wants to see whether the teaching is approachable before sharing an email address. An account gives each student private progress and reliable cross-device resume; it should not become the first obstacle to learning.

For the first public release, use **Supabase Auth** for email magic-link sign-in, then add Google sign-in if students ask for it. Keep FastAPI as the application API and use Supabase PostgreSQL as the durable database. Do not build password storage, reset flows, or session signing from scratch. The existing `DATABASE_URL` support is only a database connection; it does not provide authentication or data isolation. Supabase's [React quickstart](https://supabase.com/docs/guides/auth/quickstarts/react) covers the Vite client and its publishable key. The key is public by design; a service-role key or JWT signing secret must never be placed in `VITE_` variables or the browser.

## What the repository needs before public traffic

| Area | Current behavior | Required public behavior |
| --- | --- | --- |
| Identity | No login or server-side identity | Managed sign-in; FastAPI verifies every access token, issuer, audience, expiry, signature, and algorithm before using its `sub` claim. |
| Progress | `LessonProgress` and `Progress` are keyed only by lesson/question | Every student-owned row has `user_id`; reads and writes are scoped by verified identity. |
| Other student data | `PitchNote`, `Draft`, and `Submission` have no owner | Scope drafts, pitches, submissions, review queue, activity, and stats; index common `(user_id, ...)` lookups. |
| Browser data | System-design completion, journey state, drafts, and some scores live in `localStorage` | Move learning records to student-owned server storage; keep harmless layout/theme preferences local. Never let one signed-in user see the previous user's local data on a shared browser. |
| Backup | One global JSON file is automatically restored on startup; `/api/backup/*` is public | Remove backup/restore from the public API. Use managed database backups and an explicit, authorized per-user export/delete flow. Never restore one user's snapshot over everyone. |
| Content administration | `/api/content/reload` is public | Make content publishing a deployment/admin operation, unavailable to ordinary students. |
| Code execution | `/api/playground/run`, question runs, and demo traces execute Python subprocesses on the API machine | Keep public arbitrary-code execution off until a separate, constrained worker service is in place. Timeouts and AST filters are not a security boundary. |
| AI coach | A public endpoint can consume a paid API key | Require a student session, per-user and global quotas, response limits, and budget alerts before enabling it publicly. |
| Deployment | Local launcher binds to `127.0.0.1`; no deployment/CI configuration | HTTPS, managed Postgres, secrets at the server, tested migrations, backups, monitoring, staging, and rollback. |

The server must determine ownership from the **verified token**, not a `user_id` supplied by the browser. All student-owned queries, caches, exports, and background jobs must preserve that scope. This follows the [OWASP Multi-Tenant Security guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html). If the FastAPI database connection uses a privileged PostgreSQL credential, SQL row-level security does not automatically protect an unscoped SQLAlchemy query; enforce ownership in the API and add database RLS with an appropriate restricted role as defense in depth. Supabase's [JWT guide](https://supabase.com/docs/guides/auth/jwts) documents verification with the project's JWKS. A decoded token or client-side session check alone is not authorization.

## Implementation sequence

### 1. Separate local and hosted modes

Keep today's local workflow unchanged for development. Add an explicit hosted configuration that fails startup unless the auth project URL, database URL, HTTPS origin, and required secrets are present. In hosted mode, remove public backup and content-reload routes, disable AI coach until quotas exist, and disable all server-side code execution until an isolated worker is ready. This makes a lesson-only beta possible without claiming that the coding playground is safe. Add a clear health/readiness check for the deployed API.

### 2. Add accounts and ownership together

Add the Supabase browser client and one shared `AuthProvider`. The API client sends the current access token as a bearer token. FastAPI verifies it using the project's asymmetric signing keys, with a fixed allowed algorithm and explicit issuer/audience checks, and creates a typed current-student dependency. Make curriculum reads public, but require that dependency on every student-specific read or write. Do **not** put a sign-in button in front of the current global progress tables.

Several current curriculum responses combine lesson/question content with the learner's progress. Split those into public content and authenticated personal state, or return an explicitly empty anonymous progress view. Do not let an anonymous read of a lesson, world, or question inherit another student's state.

Use a real migration tool such as Alembic to add `user_id` to `lesson_progress`, `progress`, `pitch_notes`, `drafts`, and `submissions`; update unique keys so multiple students can share a lesson/question without overwriting one another. Define the ownership rule for any future note, review, or design assignment table before adding routes. Existing local progress needs a deliberate one-time import into a chosen account. Do not auto-assign it to the first person who signs in; the current JSON backup may contain private drafts and must not be committed or exposed by the server.

The backup file was previously tracked in Git and appears in repository history. It has now been removed from tracking while retaining the local copy. Before opening the repository publicly, inspect that history for sensitive learner content and decide whether history cleanup or data rotation is needed; removing it from the latest commit does not erase older copies.

### 3. Consolidate saved learning state

Make a small server-side learning-state API for system-design completion, journey stage, predictions, and lesson/check history. Distinguish **visited**, **practiced**, and **demonstrated understanding**; avoid treating a single correct guess as mastery. Keep per-device layout, theme, and animation preferences in local storage. On login, offer an explicit one-time import of anonymous local work after showing what will be moved. On logout, clear student-specific cached state.

### 4. Restore safe practice

Run submitted code in a separate worker with no application/database secrets, no outbound network by default, a read-only base image, an ephemeral working directory, a non-root user, CPU/memory/time/output/process limits, and concurrency/rate limits. Queue jobs; the API stores an owner-scoped job and returns its result. Review the isolation design against the [OWASP Docker guidance](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html). A container on the same host is only one layer; use a dedicated worker and host-level isolation suitable for untrusted code. Re-enable the playground only after adversarial tests and abuse limits pass.

### 5. Release professionally

Start with one managed HTTPS container serving the existing built React app and FastAPI under the same origin, plus managed Supabase Auth/Postgres. This keeps routing and CORS simple. Deploy an isolated runner separately later. Add a staging environment, reproducible build, CI checks, database migration step, error monitoring, privacy notice, data export/deletion path, and a tested database restore procedure. Keep payment and gamification out of the first release; measure whether new learners can find the starting lesson, explain a concept in their own words, and return to it later.

Treat professional quality as a learner journey, not just a polished homepage: one obvious **Start learning** action per citadel; a visible path from basics to application; consistent buttons, labels, spacing, and loading/error/empty states; keyboard and mobile usability; readable lesson widths; and a reliable **Resume where I stopped** action. Test these on the homepage, citadel entry, lesson, question, and account screens as one system. Use the existing visual language and mountain metaphor consistently rather than adding unrelated effects to make sign-in feel exciting.

## Release gates

1. **Two-account isolation:** A cannot read, overwrite, export, or infer B's progress, drafts, pitches, submissions, stats, or system-design work; check every route and cached response.
2. **Anonymous behavior:** Curriculum pages load without login; writes and personal reads fail with `401`, and the UI preserves the requested destination through sign-in.
3. **Session behavior:** Expired or forged tokens fail; sign-out removes personal data from the visible page; refresh and a second device resume the same account.
4. **Administration:** Backup/restore and content reload cannot be called from the public site, even by an ordinary signed-in user.
5. **Execution:** No arbitrary learner code runs in the API process or on a machine holding production secrets; timeout, resource, network, output, and abuse tests pass.
6. **Operations:** Migrations and rollback are tested on staging; database backups are restored in a drill; HTTPS, secret handling, error reporting, and uptime checks are verified.
7. **Learning quality:** A handful of target beginners can start the concept route without help and demonstrate an idea in a new example. Fix the observed confusion before adding more visual effects.

**Launch boundary:** Until gates 1–4 and 6 pass, keep the app on localhost or a private, access-controlled demo. A public *concept-only* beta can precede gate 5 only if every execution endpoint is disabled server-side. Do not publish the current server simply by changing its bind address.
