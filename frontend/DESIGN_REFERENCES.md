# ApexCaliber design references

The current approved visual contract is [DESIGN.md](../DESIGN.md), Direction A — Cobalt Studio. Runtime tokens live in `src/index.css`, shared study layouts in `src/pages/StudyPages.css`. This replaces the historical warm-stone/carbon and forest palettes.

## References and their application

- [Linear UI redesign](https://linear.app/now/how-we-redesigned-the-linear-ui): clear shell hierarchy and consistent information density.
- [shadcn sidebar blocks](https://ui.shadcn.com/blocks/sidebar): desktop navigation and accessible mobile drawer patterns.
- [Radix theme color](https://www.radix-ui.com/themes/docs/theme/color): semantic surface and state roles.
- [Exercism Python](https://exercism.org/tracks/python/): direct learning routes and readable practice content.
- [ExpertCode](https://expertcode.framer.website/): spacing, editorial hierarchy, purposeful product demonstrations.
- [Aceternity tabs](https://ui.aceternity.com/components/tabs): clear selected states; adapted to the existing sequential lesson flow.
- [Motion accessibility](https://motion.dev/docs/react-accessibility): reduced-motion behavior.

These are design references, not copied artwork. Subject illustrations are original SVG components. The interactive two-pointer sample advances on explicit input. Glass appears only in its small playback dock; lesson text uses opaque surfaces. Use the installed Radix Dialog for modal focus and Escape behavior. No new UI library is needed.
