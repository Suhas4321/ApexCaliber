---
trigger: always_on
description: Core Cobalt Studio visual, palette, semantic ownership, and copy honesty invariants for ApexCaliber.
---

# 01 — Core Design Invariants

## Brand & Surface System (Cobalt Studio)
- **Light Theme (Default):** `--surface-0: #f3f5f9`, `--surface-1: #ffffff`, `--surface-2: #edf2fc`, `--surface-3: #e3e9f4`, `--text-1: #162033`, `--study-accent: #315efb`.
- **Dark Theme & `[data-zone='night']` / `.stage`:** `--surface-0: #101522`, `--surface-1: #182132`, `--surface-2: #212d42`, `--surface-3: #2b3951`, `--text-1: #f0f4fc`, `--study-accent: #91adff`.
- **Never hardcode competing dark fills** (`#0d1117`, `#161b22`, `#000000`) for code panels or cards; consume semantic tokens (`bg-void`, `bg-panel`, `bg-panel-2`, `text-chalk`, `text-muted`, `border-line`).
- **Anti-Violet Rule:** Never introduce `#8b5cf6`, violet gradients, `text-orchid`, or purple (`OKLCH` hue `270–330deg`) into UI chrome, progress rings, timeline bars, or telemetry canvases. Use Cobalt (`--study-accent`), Emerald (`--color-emerald`), Amber (`--color-amber`), or Crimson (`--color-crimson`).
- **Zero Orphaned Brand Classes:** Never write undefined Tailwind tokens (`bg-brand`, `text-brand`, `border-brand`, `text-brand-light`). Use `bg-action`, `text-cyan`, `border-cyan`, or `var(--study-accent)`.

## Copy, Honesty & Restraint
- **No Slop Copy or Fake Telemetry:** Never use `Math.random()` for latency/throughput readouts, invented learner numbers, marketing clichés ("supercharge", "revolutionize", "cutting-edge"), or two-fragment slogan filler where direct capability naming is clearer.
- **No Captions Under Visuals:** Interactive traces, code demos, and diagrams are self-labeled inside their own headers; never place italic or mono explanatory captions beneath them.
- **No Emojis in UI Chrome:** Use crisp Lucide icons at consistent stroke weights rather than Unicode emoji characters (`🪙`, `⚡`, `🔥`) in buttons, HUD badges, or telemetry pills.

## Component & Accessibility Ownership
- **Fonts:** Use self-hosted `Inter` (`--font-sans`), `Sora` (`--font-plate`), and `JetBrains Mono` (`--font-mono`) strictly via theme tokens. No external font CDNs.
- **Dialogs & Selects:** Retain native `<select>` controls for OS popup geometry and `@radix-ui/react-dialog` for accessible modals/drawers.
- **Opaque Reading Surfaces:** Study guides, dashboards, and problem statements stay solid (`bg-panel`) with `max-width: 72ch–75ch`; reserve subtle translucency only for transient navigation bars or stage overlays.
