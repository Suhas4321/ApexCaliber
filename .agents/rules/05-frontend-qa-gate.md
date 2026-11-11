---
trigger: model_decision
description: Frontend quality assurance, responsive viewport checks, and pre-delivery build verification checklist. Run before finalizing any frontend implementation or style change.
---

# 05 — Frontend Verification & QA Gate

Run and verify every item below before considering any UI task complete:

## 1. Automated Build & Type Gate (Mandatory)
- Navigate to `frontend/` and execute:
  - `npx tsc --noEmit` — **0 TypeScript errors**.
  - `npm run build` — **clean production bundle** with zero missing imports or CSS syntax errors.

## 2. Responsive Layout & Overflow Audit
Verify layouts stay intact cleanly with **zero horizontal scroll (`documentElement.scrollWidth <= window.innerWidth`)** across:
- **Desktop Wide (`1440px`):** Hero, dashboard bento, side-by-side workspace panes align within `.shell` (`1280px`) with balanced L/R gutters and prose measures (`<= 72ch–75ch`).
- **Small Desktop / Tablet Landscape (`1024px`):** Navigation headers and two-column panels do not clip labels or wrap actions mid-word.
- **Tablet Portrait (`768px`):** Radix drawer replaces desktop curriculum rail smoothly; multi-node architecture simulators stack or wrap cleanly without truncated hops.
- **Mobile (`390px` & `320px`):** Interactive controls maintain `>= 44px` accessible hit area and `>= 8px` clearance; CTAs fill mobile width cleanly without overflowing or clipping behind fixed elements.

## 3. Accessibility & Theme Parity Audit
- **Dual-Theme Check (`html[data-theme="light"]` & `dark`):** Inspect dark `.stage` / `[data-zone="night"]` components under **Light Mode** to confirm zero dark-text-on-dark-surface or white-text-on-light-card regressions.
- **Keyboard Tab Walk:** Confirm `Tab` enters skip links first, every custom control (`button`, slider `<input type="range">`, step tab, close trigger) renders an unmistakable `:focus-visible` outline, and Radix modal dialogs trap focus + restore focus on `Esc`.
- **Static Regression Scan:** Grep changed files to confirm zero introduced `#8b5cf6`, `text-orchid`, `bg-brand`, `text-brand`, `transition-all`, unguarded `animate-pulse` on reading UI, or `focus:outline-none` without a replacement ring.
