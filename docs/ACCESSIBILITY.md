# Accessibility

Target: WCAG 2.1 AA.

Implemented: a skip link to `#main`; semantic landmarks (`header`/`main`/`footer`)
and headings; labelled form controls (`label`+`htmlFor`); `fieldset`/`legend` for
the context selector; `aria-live="polite"` status regions for loading/results;
`aria-expanded` on disclosures and `aria-pressed` on the reading-level toggle;
`role="alert"` for errors; visible `:focus-visible` outlines; dark-mode via
`prefers-color-scheme`; evidence status conveyed by text + icon, never colour
alone. A component render test asserts the disclaimer, demo entry points and a
verified badge are present.

Recommended before submission: run `axe` in the browser and complete the core
flow keyboard-only. Automated `axe`/Playwright coverage is a planned addition. Grounded findings can be opened in a rendered PDF page with the source highlighted (verify the overlay visually in your browser).
