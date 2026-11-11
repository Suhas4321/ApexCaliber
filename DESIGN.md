---
version: alpha
name: ApexCaliber
description: A first-principles engineering learning journey with a clear marketing entrance and a focused study workspace.
colors:
  canvas-dark: "#101522"
  canvas-light: "#F3F5F9"
  panel-dark: "#182132"
  text-dark: "#F0F4FC"
  text-light: "#162033"
  landing-canvas: "#F3F5F9"
  landing-terminal: "#101522"
  landing-accent: "#315EFB"
  landing-success: "#99d7ae"
typography:
  sans:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
  display:
    fontFamily: "Sora, Inter, sans-serif"
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

A focused study desk that moves from a first idea to a working engineering solution. Direction A, Cobalt Studio, uses cool platinum and white around restrained cobalt actions and navy teaching stages. The learning workspace starts with one next step and uses quiet reading surfaces, consistent controls, and plain navigation.

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

The approved Direction A uses cool platinum `#F3F5F9`, white panels, ink `#162033`, supporting text `#526078`, secondary text `#687487`, and cobalt actions `#315EFB`. Dark mode uses navy `#101522`, panels `#182132`, text `#F0F4FC`, and blue actions `#91ADFF`. Semantic success, warning and error keep their meanings. Category colors appear in cover illustrations and small cues. White on cobalt is approximately 5.1:1; muted text must remain at least 4.5:1 on its reading surface. 60:30:10 is a visual heuristic, not a measured quota. New visits default to light; saved dark/system preferences remain respected.

## Typography

Inter handles prose and controls; Sora gives headings a clear technical identity; JetBrains Mono is reserved for code and compact data labels. Fonts are self-hosted. Lesson prose is 16–17px with 1.8–1.9 line height and a maximum measure of 75ch. Headings scale between 30 and 48px on the learning home and 26–36px in lessons.

## Layout

The learning shell has a 232px fixed desktop sidebar, a 76px search/account header, and a document-scrolling content area up to 1320px. Below 1000px, navigation becomes a Radix modal drawer. Full-width tool pages (system design and interview practice) use the same navigation in a drawer to preserve reading and working space. Questions and the code playground keep their full-screen workspace structure.

Learning home pairs the real next step with a separately labeled, user-paced two-pointer example. Subject covers use original code-native technical diagrams. Subject pages combine an illustrated introduction with wide module/topic rows. Syllabi keep prerequisites visible. Lessons preserve Understand → Explore → Check with a sticky step bar and focus movement to each new stage. Progress uses actual data only. System design uses document scrolling, a collapsible curriculum, and an on-page contents menu.

## Elevation & Depth

Use borders and tonal surfaces for most grouping. Reserve the largest shadow for the homepage's learning demo; keep lesson reading cards quiet. The product header and reading surfaces stay solid. A light frosted treatment is confined to the example playback dock; diagrams respond gently to hover. No continuous decorative animation runs behind study material.

## Shapes

The homepage uses compact 6–13px corners to evoke an editor and worksheet. Product cards and controls use a shared modest radius. Code and route labels use thin dividers.

## Components

### Foundational visual states

Actions have visible focus, hover, and pressed states. Disabled and busy states preserve button size. Errors explain a recovery action. The existing product skeletons remain the loading treatment.

Native select menus are intentional in the editor, revision sheet, playground, and interview tools: the operating system owns their popup geometry and keyboard behavior. Keep trigger styling in the shared palette. Long lesson notes grow with their content instead of showing a resize handle.

### Buttons and actions

Product actions use cobalt; the public primary action uses ink. Sign-in uses the navy and blue palette. Log out stays in the account menu, including coding workspaces. Category colors never replace the shared action color.

### Navigation and data display

Homepage navigation jumps to the method, learning areas, and reserved demo. `/app` is learning home. The shared sidebar owns learning home, subjects, progress, practice, system design, interviews, pattern finder, revision guide, and playground. Account actions stay in the avatar menu; local backup remains under More. Search uses the existing local topic/question index and keyboard shortcuts, now inside a Radix focus-trapped dialog with explicit clear and close controls.

### Forms and overlays

Hosted mode uses an email-link sign-in form. Local mode uses a one-account username and password form backed by a server-side hash and an HTTP-only session cookie. Form errors remain inline and announced.

### Iconography

Lucide provides restrained interface symbols, paired with text for actions. The existing summit mark remains the ApexCaliber logo, recolored to cobalt.

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

- [ExpertCode](https://expertcode.framer.website/) informed the editorial hierarchy and dark product example.
- [Aceternity Startup](https://ui.aceternity.com/template-preview/startup-landing-page-template) informed the hero grid and action alignment.
- [Codecademy dashboard](https://www.codecademy.com/learn) and [Exercism tracks](https://exercism.org/tracks/python) informed the quiet, legible learning home and topic lists. These are design references, not copied layouts or assets.
- The static homepage example remains the placeholder for a future motion graphic. Its final animation will follow the approved lesson and editor UI.

## Canonical runtime mapping and approved migration

The user approved Direction A on 11 November 2026. This replaces the previous cream/forest direction deliberately; it is not a feature-specific override.

| Role | Runtime owner | Consumers |
| --- | --- | --- |
| Palette, type, focus, scrollbar | `frontend/src/index.css` | Tailwind aliases and all product components |
| Layout, reading rhythm, cards, navigation | `frontend/src/pages/StudyPages.css` | App shell and learning pages |
| Shared actions and statuses | `frontend/src/components/ui.tsx` | Product controls |
| Desktop/mobile navigation | `frontend/src/components/StudyNavigation.tsx` | Normal shell and focus-workspace variant |
| Modal behavior | Installed Radix Dialog | Navigation, curriculum drawer, command palette |
| Subject art | `frontend/src/components/SubjectArtwork.tsx` | Learning home and subject introductions |
| Demonstration state | `frontend/src/components/ConceptPreview.tsx` | User-paced sample, independent of learner progress |
| Public palette adapter | `frontend/src/pages/LandingPage.css` | Public entrance |

See `UX-CONTRACT.md` for behavioral ownership. All authored learning data stays unchanged. The final homepage motion graphic remains deferred.
