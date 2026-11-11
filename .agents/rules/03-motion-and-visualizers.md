---
trigger: model_decision
description: Animation curves, GPU-only transforms, visualizer RAF safeguards, reduced-motion handling, and loop pause rules. Load when touching Motion graphics, visualizers, sliders, or CSS transitions.
globs: frontend/src/{components/motion,components/visualizers,components/system-design,lib/motion.ts}/**/*
---

# 03 — Motion & Visualizer Performance

## Approved Easing & Durations (`motion.ts`)
- **UI Step / Hover / Micro-interaction:** `cubic-bezier(0.2, 0.8, 0.2, 1)` (`motionPresets.ease.out`), `150ms–180ms`.
- **Entrance / Modal / View Transition:** `cubic-bezier(0.22, 1, 0.36, 1)`, `220ms–360ms`.
- **Indicator Travel (Tab slider, Switch knob):** `cubic-bezier(0.65, 0, 0.35, 1)`, `240ms`.
- **Never** rely on unconfigured browser `ease` / `ease-in-out` on bespoke transitions, and **never** use spring overshoot/bounce on UI buttons or cards (`damping` must keep transitions critically damped).

## GPU-Only Properties (Zero Layout Thrash)
- Animate **only** compositor-friendly properties: `transform` (`translate3d`, `scale`) and `opacity`, plus subtle static color swaps (`transition-colors`).
- **Bans:**
  - Never use Tailwind `transition-all`. List explicit properties (`transition-[transform,background-color,border-color]`).
  - Never animate `left`, `top`, `right`, `bottom`, `width`, `height`, `margin`, `padding`, or `hover:h-3` on interactive tracks. Use `transform: translate3d(...)` or `scaleX(...)` for packet travel and progress scrubbers.

## Visualizer & Study Restraint
- **No Scroll-Fade Card Reveals:** Never hide below-the-fold cards/rows behind scroll-triggered `whileInView` fade-in staggers. Content reads immediately on scroll.
- **Hover Micro-Feedback (`@media (hover: hover) and (pointer: fine)`):** Interactive cards lift gently (`-2px`) and advance directional arrows by `3px`; focus shows the identical visual cue immediately.
- **No Decorative Endless Pulse:** Replace idle `animate-pulse` / `animate-ping` status blobs in toolbars, code trace line pills, and architecture nodes with calm static state indicators (`border-cyan bg-cyan/15`, solid status dots).
- **Reduced Motion & Loop Controls:**
  - Read `isReducedMotion()` from `frontend/src/lib/motion.ts` (and listen for OS changes) inside `requestAnimationFrame` simulators (`ArchitectureFlowSimulator`, `MotionGraphicPlayer`). When reduced motion is active, jump cleanly to deterministic stepped states instead of driving continuous packet sweeps.
  - Any continuous loop lasting `> 5s` must expose a clearly labeled Play/Pause toggle inside its container chrome.
- **Deterministic Simulations:** Architecture simulators compute latencies and throughput deterministically from node configs and simulation mode—never generate random fake telemetry (`Math.random()`).
