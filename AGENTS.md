# ApexCaliber Engineering & Design Workspace Contract

ApexCaliber (`/home/suhas/Desktop/DSA`) is an interactive engineering learning studio for DSA, Python, SQL, OS, Networking, Backend APIs, AI/Retrieval, and System Design.

## Stack & Architectural Owners

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), `motion` (`motion/react`), Lucide icons, installed Radix Dialog (`@radix-ui/react-dialog`), Monaco Editor (`@monaco-editor/react`), and self-hosted `@fontsource/{inter,sora,jetbrains-mono}`.
- **Canonical Truth Docs (never drift from these):**
  - [DESIGN.md](./DESIGN.md) — Approved Direction A (**Cobalt Studio**), surface palette, self-hosted fonts, and asset/motion restraint.
  - [UX-CONTRACT.md](./UX-CONTRACT.md) — Route hierarchy, Radix modal ownership, native `<select>` ownership, scroll ownership, and accessibility invariants.
  - [frontend/src/index.css](./frontend/src/index.css) — Unified `@theme` aliases, CSS variables, `.stage` / `[data-zone='night']` dark code zones, and reduced-motion baselines.

## Non-Negotiable Product Invariants

1. **Cobalt Studio Palette (`#101522` / `#182132` Dark · `#F3F5F9` / `#FFFFFF` Light):**
   - Preserve deep navy dark surfaces (`--surface-0: #101522`, `--surface-1: #182132`, `--surface-2: #212d42`) and platinum/cobalt light surfaces (`#f3f5f9` / `#ffffff`, action `#315efb` light / `#91adff` dark).
   - **Zero violet/lavender** (`#8b5cf6`, `text-orchid`, hue `270–330deg`) in application UI chrome or visualizers.
2. **Dark Night Zones (`.stage` & `[data-zone='night']`):**
   - Code panes, terminal traces, and canvas stages always enforce dark zone tokens regardless of outer light/dark theme toggle. Never place theme-light text on dark canvas backgrounds or hardcoded light text on `--surface-1` in Light Mode.
3. **Pedagogical Restraint & Honesty:**
   - Study screens use opaque reading surfaces with zero decorative autoplay behind prose.
   - Never fabricate metrics, `Math.random()` latency readouts, fake testimonials, placement claims, or UI emojis in header chrome.
   - Code and architecture previews show genuine product traces and controls rather than synthetic mockups or decorative captions below visuals.
4. **Native Controls & Dialog Ownership:**
   - Keep `<select>` elements native across editors and tools ([premium-ui.json](./premium-ui.json)).
   - Modals and drawers (<1000px app nav, <1024px system design curriculum, command palette) must use Radix Dialog with focus trapping and Escape handling.
5. **Modular Frontend Rules (`.agents/rules/`):**
   - Always honor `.agents/rules/01-design-invariants.md`.
   - Load `02-geometry-and-type.md`, `03-motion-and-visualizers.md`, `04-interactive-states.md`, and `05-frontend-qa-gate.md` whenever editing or reviewing frontend styles, visualizers, interactive flows, or responsive layouts.
   - Always run `npm run build` (and `npx tsc --noEmit` in `frontend/`) before finishing any UI change.
