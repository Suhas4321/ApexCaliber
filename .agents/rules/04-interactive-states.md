---
trigger: model_decision
description: Complete 5-state interactive contract, tactile press physics, keyboard focus visibility, shape-matched skeletons, mobile hit targets, and auth error safety. Load when building React pages or controls.
globs: frontend/src/{pages,components}/**/*.tsx
---

# 04 — Interactive States, Access & UX Resilience

## 5-State Control Completeness
Every clickable button, link-card, tab, input, and range slider must explicitly handle all five states:
1. **Default:** Crisp `1px` border parity (`border-line` / `border-line-strong`) or primary Cobalt fill (`bg-action` / hero `#162033`).
2. **Hover (`@media (hover: hover)`):** Clear tonal step without sibling layout push; no blurry ambient drop-shadows around controls at rest.
3. **Active / Pressed:** Primary and secondary action buttons provide subtle tactile compression (`active:scale-[0.985]` or `active:translate-y-px` over `90ms`), reverting smoothly on release.
4. **Focus-Visible (Zero Transition Delay):**
   - **Never** write `focus:outline-none` without an explicit high-contrast replacement ring (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--study-accent)]`).
   - Range sliders (`<input type="range">`), Monaco wrappers, and custom switches must show an unmistakable `:focus-visible` indicator immediately on Tab arrival (`transition-property` excludes outline).
5. **Disabled / Busy:** Preserve exact button dimensions (`min-width`/`min-height`), lower opacity intentionally (`opacity-40`–`60`), apply `disabled:cursor-not-allowed` / `cursor-wait`, and announce status changes via polite live regions where helpful.

## Loading, Empty & Error Patterns
- **Shape-Matched Skeletons:** Loading views (`Dashboard`, curriculum views, question pages) must render structural `<Skeleton />` placeholders matching the loaded page's real grid geometry (hero split + multi-column card grid), never arbitrary mismatched stacked rectangles.
- **Inline Actionable Errors:** Display validation and network failures inline inside `role="alert"` regions adjacent to the failing form field or action bar—never hide critical failures inside auto-dismissing toasts. Focus the first offending input on client validation errors and preserve non-secret user input across retries.
- **Non-Disclosing Auth & Recovery UX (`SignInPage`):** Map raw backend/SDK authentication errors (`body.detail`, Supabase errors) cleanly so internal stack traces, account existence ambiguity, or internal config hints never leak into UI alerts. Clear password inputs upon failed local auth while retaining username/email context safely.

## Responsive & Touch Ergonomics
- **Tap Targets (`>= 44px` Mobile):** Controls on coarse-pointer screens (`< 768px`)—including toolbar toggles, simulator speed pills, and inline action chips—must provide at least a `44px` interactive height/hit area with `>= 8px` gap between adjacent targets.
- **Overflow-Safe Diagrams & Tables:** Never lock multi-node diagrams (`min-w-[660px]`) into horizontal scroll traps on `< 768px` screens. Reflow linear flow lanes vertically (`flex-col md:flex-row`) or provide clean responsive stacking with readable connectors.
