---
description: "Validate and edit CSS in this Tailwind CSS application without misdiagnosing framework directives."
applyTo: "**/*.css"
---

# CSS Validation

- Treat `@tailwind`, `@apply`, and `theme("...")` as intentional Tailwind CSS syntax; do not replace them with plain CSS solely to satisfy a generic CSS validator.
- Reuse the design tokens in `tailwind.config.ts` and the shared utilities in `src/app/globals.css` before adding new colors, fonts, shadows, or component classes.
- Keep global rules in `src/app/globals.css`; prefer Tailwind classes for page- or component-specific styling.
- There is no dedicated CSS lint script. Validate CSS changes with `npm run build`, which runs the Next.js/PostCSS/Tailwind pipeline, and use `npm run lint` for related TypeScript/JS diagnostics.
- When a CSS diagnostic conflicts with Tailwind syntax, verify the production build before changing working styles.