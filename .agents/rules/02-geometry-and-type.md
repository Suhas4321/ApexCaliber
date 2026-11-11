---
trigger: model_decision
description: Unified type scale, spacing grid, concentric border radii, box-nesting ceiling, and hairline card borders. Load when styling components, CSS stylesheets, or page layouts.
globs: frontend/src/**/*
---

# 02 — Geometry & Typography Discipline

## Unified Type Scale
Use one single tokenized type scale anchored in `frontend/src/index.css`. Avoid arbitrary `px` overrides (`text-[9px]`, `text-[10px]`, `text-[11px]`, `23px`, `29px`, `67px`).

- **Body & Card Prose:** `>= 16px` (`--text-base` / `--text-body`, `line-height: 1.6`) at high ink contrast (`--text-1` or `>= 84%` ink contrast for primary reading sentences). Never render multi-sentence descriptions in dim small muted text under `14px`.
- **UI Controls & Secondary Spec Text:** `14px` (`--text-sm` / `--text-ui`).
- **Minimum Readable Labels / Mono Badges / Meta:** `>= 12px` (`--text-xs: 12px` for code/table captions & trace tags; `13px` `--text-2xs` reserved only if compact chip readability stays high — unified to one canonical scale in `index.css`). Never go below `12px` in CSS (`10px`/`9px`/`8px` font sizes are banned).
- **Heading Hierarchy:** Maintain strict visual size steps (`h1 > h2 > h3 > body`). Keep hero/section descriptions capped (`max-width: 680px` / `72ch`) with `text-wrap: pretty` or balanced headings.

## 4px Spacing Scale
Prefer clean multiples of `4px` (`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120`) for paddings, margins, and grid gaps. Prune off-grid magic numbers (`7px`, `13px`, `23px`, `29px`, `31px`).

## Concentric Corner Radii ($R_{inner} = R_{outer} - P$)
Whenever a curved container nests an interactive box inside tight padding (`gap < 32px`):
- Compute inner radius strictly as **$R_{inner} = \max(4\text{px}, R_{outer} - P)$**.
- Canonical stacks:
  - Card (`16px` / `rounded-2xl`) + `8px` inset $\rightarrow$ Inner frame `8px` (`rounded-lg`).
  - Surface panel (`12px` / `rounded-xl`) + `4px` padding $\rightarrow$ Segmented pill / inner button `8px` (`rounded-lg`).
  - Toolbar track (`8px` / `rounded-lg`) + `4px` padding (`p-1`) $\rightarrow$ Active tab button `4px` (`rounded`).
- Never mix conflicting radius utility classes on the same node (e.g., do not combine `.card` `12px` with `rounded-2xl` `16px`).

## Card Structure & Anti-Box-Slop
- **Max 2 Container Levels:** Outer surface box $\rightarrow$ single visual well or content block. Never nest bordered card $\rightarrow$ bordered panel $\rightarrow$ bordered inner card. Prefer full hairline grids (`divide-x`, `divide-y`, `border-b border-line`) for track lists and syllabi.
- **No Single-Sided Card Borders:** Never apply `border-l-[3px]` combined with `rounded-r-md` on callouts or blockquotes. Wrap callouts cleanly in full uniform `1px` borders (`rounded-lg border border-line bg-panel-2`) led by an inline semantic label pill/header.
