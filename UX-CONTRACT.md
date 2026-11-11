# ApexCaliber interaction contract

Visual intent and tokens: [DESIGN.md](DESIGN.md). English product for engineering students and graduates. No billing or user management is introduced by this redesign.

## Canonical UI ownership

| Capability | Owner | Contract |
| --- | --- | --- |
| Navigation | `App.tsx`, `StudyNavigation.tsx`, React Router | Real links; document scroll resets on route changes; subject anchor scrolls to catalog; deep links survive sign-in. |
| Dialog | Installed Radix Dialog | Focus trap, accessible title, Escape, focus return; shared drawer styles. |
| Search | `CommandPalette.tsx` | Local topic/question index, immediate filtering and clearing; arrow/Enter shortcuts ignore IME composition; transient query, no URL persistence. |
| Select/Listbox | Native select | OS owns popup geometry and keyboard behavior; keep visible labels and theme-aware triggers. |
| Form | Existing sign-in, lesson and interview components | Preserve API/validation behavior, inline errors, disabled/busy states; textarea auto-growth. |
| Scrollbar | `index.css` | One visible baseline with theme tokens and forced-colors fallback; document scrolling for reading. |
| Feedback | Existing inline ErrorNote/status regions | Critical failures stay near their action; success includes text, not only color. |
| Progress | Existing API + systemDesignProgress | No fabricated completion. Demonstrations never mutate progress. |
| Content lists | Existing bounded curriculum data | Render all finite authored modules/topics; search results capped at 40. |

## Learning flow

Home → subject → syllabus/topic → lesson/question. Keep the real next lesson/question as the primary home action. Subject cards expose all seven subjects plus system design. Locked lessons explain their prerequisite and link to it. Lesson steps retain Understand → Explore → Check; step changes focus the new stage. Incorrect answers explain and permit retry. Complete checks unlock the existing next step through the existing API.

## Shell variants and responsive behavior

- Normal learning routes: sidebar at desktop, modal navigation below 1000px.
- Multi-pane tools: full-width system design/interview workspace with navigation drawer; no duplicate global rail crowding the reading area.
- Questions/playground: preserve dedicated full-screen layout and account menu.
- System design: collapsible desktop curriculum, modal curriculum below 1024px, document-owned reading scroll, contents disclosure for section jumps.
- Account actions including Log out remain in the account menu.

## Data and safety boundaries

All authored content, answer checks, progress persistence, login and code-running contracts are preserved. Local backups stay under More → Local data with their existing confirmation. No hosting or cloud configuration is part of this change. Test accounts/progress belong in an isolated local database, never in the user's database.

## Accessibility and motion

Native button/link semantics; named icon actions; visible focus; labels and status text. Honor reduced motion. The home example is manually stepped and replayable, with an announced equation and explanation. Opaque reading surfaces; no decorative autoplay. Light is the default for new visits; saved theme preferences win.
