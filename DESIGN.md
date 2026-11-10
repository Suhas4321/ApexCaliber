---
version: alpha
name: ApexCaliber
description: A first-principles engineering learning journey with a clear marketing entrance and a focused study workspace.
colors:
  canvas-dark: "#141B18"
  canvas-light: "#F6F7F3"
  panel-dark: "#1C2520"
  text-dark: "#F1F4EF"
  text-light: "#1E2A22"
  landing-canvas: "#F6F7F3"
  landing-terminal: "#141B18"
  landing-accent: "#245C42"
  landing-success: "#99d7ae"
typography:
  sans:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
  display:
    fontFamily: "IBM Plex Sans Condensed, IBM Plex Sans, sans-serif"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
rounded:
  DEFAULT: "0.75rem"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "1.5rem"
spacing:
  landing-page-max: "80rem"
  landing-section-gap: "7rem"
  product-reading-max: "75ch"
components:
  button: {}
  card: {}
  navigation: {}
  learning-demo: {}
---

# ApexCaliber design system

## Overview

### Creative North Star

A focused study desk that moves from a first idea to a working engineering solution. The public page uses warm neutral paper around a dark teaching demo. The learning workspace starts with one next step and uses quiet reading surfaces, consistent controls, and plain navigation.

### Product context and register

- **Audience and primary job:** Engineering students and graduates preparing for coding interviews and software jobs. Help them understand an idea, see it in code, practice it, and resume their route.
- **Markets and language:** English-language product; the repository does not define a country-specific market.
- **Usage scene:** A laptop for lessons and code practice, with a phone-friendly public entrance and reading flow.
- **Register:** Hybrid. `/` is a marketing entrance, `/sign-in` is the auth transition, and `/app` plus the other learning routes are product UI.
- **Signature:** A small two-sum learning example that moves from reasoning to code on the homepage.
- **Restraint:** Explanations and real practice should lead. Avoid invented outcome numbers, testimonials, or complete-curriculum claims while the authored foundation library is growing.
- **Anti-references:** Generic gradient SaaS heroes, three identical benefit cards, and decorative code windows with no actual teaching content.
- **Token ownership:** This file documents the runtime source of truth. Product tokens live in `frontend/src/index.css`; public-page tokens live in the `.landing` scope of `frontend/src/pages/LandingPage.css`. The existing product contract is detailed in `docs/APEXCALIBER_DESIGN_SYSTEM.md`.

## Colors

The product uses forest charcoal `#141b18` in dark mode and warm neutral `#f6f7f3` in light mode. White or dark green-gray panels carry reading content. Green `#245c42` in light mode and `#a8d5af` in dark mode marks the primary action; muted subject accents identify learning areas. Success and error colors keep their own meanings. The homepage uses the light palette with a charcoal teaching demo. This follows a dominant canvas, supporting surfaces, and restrained accents; 60:30:10 is a review heuristic, not a numeric target.

## Typography

IBM Plex Sans handles prose and controls, Condensed gives section headlines a practical technical character, and JetBrains Mono labels code, steps, and numeric state. Keep product prose around 75 characters per line.

## Layout

The public page uses a 1280px maximum canvas with a centered editorial hero, an early primary action, and a dark concrete learning example beneath it. `/app` begins with one next-step action, followed by a consistent subject grid. Subject pages expose foundation lessons and practice topics. Lessons retain a narrow reading measure; questions retain the split problem/editor workspace. Keep the primary action visible before scrolling at common desktop sizes and early on narrow screens.

## Elevation & Depth

Use borders and tonal surfaces for most grouping. Reserve the largest shadow for the homepage's learning demo; keep lesson reading cards quiet. The product header is a solid, compact navigation row without glass cards or animated controls.

## Shapes

The homepage uses compact 6–13px corners to evoke an editor and worksheet. Product cards and controls use a shared modest radius. Code and route labels use thin dividers.

## Components

### Foundational visual states

Actions have visible focus, hover, and pressed states. Disabled and busy states preserve button size. Errors explain a recovery action. The existing product skeletons remain the loading treatment.

Native select menus are intentional in the editor, revision sheet, playground, and interview tools: the operating system owns their popup geometry and keyboard behavior. Keep trigger styling in the shared palette. Long lesson notes grow with their content instead of showing a resize handle.

### Buttons and actions

The homepage's dark button is the primary path to sign-in or learning; green marks selected copy and links. The sign-in screen uses a light green action on a dark surface. Signed-in navigation places Log out in the account menu, including in coding workspaces. Product actions use one semantic green accent, while subject colors stay secondary.

### Navigation and data display

Homepage navigation jumps to the method, learning areas, and workspace preview. The `/app` route is learning home; breadcrumbs and the product logo return there. Primary navigation uses Learning home, Practice, and Progress. On narrow screens, Practice and Progress move into More. Signed-out profile access goes to sign-in. Secondary tools stay in More; local backup is collapsed under Local data; account actions stay in the avatar menu.

### Forms and overlays

Hosted mode uses an email-link sign-in form. Local mode uses a one-account username and password form backed by a server-side hash and an HTTP-only session cookie. Form errors remain inline and announced.

### Iconography

Lucide provides restrained interface symbols, paired with text for actions. The existing summit mark remains the ApexCaliber logo, recolored to the forest palette.

### Motion

Use short hover feedback and state changes only. Respect reduced motion. The homepage learning example changes only on user input.

The public homepage reserves room for a future code-driven learning demo. Defer its final motion graphic until the interior learning and editor layout is chosen; the demo must show the real product experience rather than a fictional interface.

### Content and data visualization

Say what learners will actually do: understand, trace, write, and check. The homepage shows a real small example and describes partial foundation-route coverage honestly.

## Do's and Don'ts

- **Do:** Show the bridge from a simple idea to code and practice.
- **Do:** Lead the learner through one next action, then offer subjects and tools.
- **Do:** Preserve distinct subject accents within one shared product layout and control system.
- **Do:** Preserve all authored learning content and practice capabilities during any interface redesign.
- **Don't:** Invent placement claims, learners, testimonials, or course completeness.
- **Don't:** Let decorative UI crowd a lesson's explanation or code.

## References and implementation status

- [ExpertCode](https://expertcode.framer.website/) informed the editorial hierarchy, warm public canvas, and dark product example.
- [Aceternity Startup](https://ui.aceternity.com/template-preview/startup-landing-page-template) informed the hero grid and action alignment.
- [Codecademy dashboard](https://www.codecademy.com/learn) and [Exercism tracks](https://exercism.org/tracks/python) informed the quiet, legible learning home and topic lists. These are design references, not copied layouts or assets.
- The static homepage example remains the placeholder for a future motion graphic. Its final animation will follow the approved lesson and editor UI.
