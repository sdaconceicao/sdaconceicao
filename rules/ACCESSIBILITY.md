# Accessibility Standards

## Quick Reference

This rule works with:

- **Styling Standards** - Token remaps are the mechanism for global adaptation
- **E2E Testing Standards** - Where accessibility is actually verifiable
- **Astro Standards** - Component patterns that keep semantics intact

## Core Principles

1. **Accessibility is a functional requirement, not a review comment** - A
   broken landmark is a broken feature
2. **Prefer native semantics over ARIA** - A correct element beats a correct
   attribute
3. **Never let colour be the only signal** - Pair it with shape, length, text,
   or an icon
4. **Every interactive affordance must work by keyboard** - Not just by pointer
5. **Assert it in a test** - Automated scans catch the class of regression no
   reviewer reliably spots

## Landmarks and Document Structure

- `<header>` maps to `banner` and `<footer>` to `contentinfo` **only when not
  nested in sectioning content**. A `<footer>` inside `<main>` silently stops
  being a landmark — no error, no warning, it just disappears.
- Keep layout wrappers as plain `<div>`. The moment a wrapper becomes a
  `<section>` or `<article>`, the landmarks inside it vanish just as quietly.
- **Assert landmark counts in E2E**, not just presence. This is the only way the
  above stays true through a refactor.
- Named `<section>` elements become `region` landmarks, which makes a page
  navigable by rotor. Four or five is useful; twenty is noise.

### Headings

**Exactly one `<h1>` per page.** This is the most common failure in a composed
layout, where each component is individually correct: a shared header renders
an `<h1>` and the page renders its own.

Make the heading level a function of context rather than hardcoding it:

```astro
---
// The rail owns the h1 only where the person IS the subject. Elsewhere the
// page's own title owns it and the name renders as a paragraph.
const NameTag = variant === "home" ? "h1" : "p";
---
<NameTag class="rail-name">{name}</NameTag>
```

Where a component's tag varies, **set its visual properties explicitly** — a
`<p>` will not inherit the heading colour a global `h1, h2, h3` rule provides,
and the element silently renders in the wrong colour.

## Keyboard

**Every hover affordance must also fire on focus.** A card that highlights on
`:hover` but not `:focus-within` gives keyboard users no affordance at all, and
it passes every automated check:

```css
.card:hover::before,
.card:focus-within::before {
  opacity: 1;
}
```

- **`outline: none` is never acceptable.** If a ring looks wrong, restyle it.
- **A single-colour focus ring cannot pass on every surface.** Use the WCAG 2.2
  SC 2.4.13 dual ring — an inner halo in the page background filling the outline
  offset, then the outline itself. Whichever surface sits underneath, one of the
  pair contrasts. Verify against your accent fill specifically; that is where a
  single ring usually fails.
- **Never create a nested scroll region you did not intend.** Chrome and Firefox
  make scroll containers keyboard-focusable automatically; **Safari does not**,
  so content that overflows becomes unreachable. Constrain the content or change
  the layout — do not paper over it with `overflow: auto`.
- Fragment targets need `tabindex="-1"` so a deep link moves focus rather than
  only scrolling. Do not pair it with `outline: none`: programmatic focus does
  not match `:focus-visible`, so no ring appears anyway.

## Accessible Names

**Icon-only controls get their name from visually-hidden text, not `aria-label`:**

```astro
<a href={href} class="social-link">
  <Icon name={icon} />
  <span class="sr-only">{label}</span>
</a>
```

`aria-label` is invisible to browser translation features and to most machine
translation pipelines — an `aria-label`-only site is monolingual for
screen-reader users in every other locale. Visually-hidden text is also what
"find on page" matches and what translation extraction picks up.

Hide `.sr-only` with `clip-path`, never `display: none`. A skip link should be
translated out of view so it stays in the accessible tree.

## Colour Independence (SC 1.4.1)

Colour may reinforce a state; it may never be the only thing carrying it.

| Signal | Non-colour channel |
| --- | --- |
| Active nav item | Indicator changes **length**, not just colour |
| Link in body copy | Underline, always |
| External link | Icon plus "(opens in a new tab)" |
| Status / badge | A text label |
| Diff lines | Left border plus a `+`/`-` gutter marker |

**Do not signal state with `font-weight`.** On a variable font that changes
advance widths and shifts the label sideways on every state change.

Links whose role is structurally unambiguous (nav items, card titles) do not
need an underline. A link inside a paragraph does.

## ARIA Details That Are Easy To Get Wrong

- **`aria-current="location"`** for position within a flow, such as a table of
  contents tracking scroll. `"page"` means navigation happened and will mislead
  a screen-reader user.
- **`role="list"` must be restored** on any list styled with
  `list-style: none` — Safari/VoiceOver strips list semantics otherwise. The
  authoring rule: if you remove the markers, you add the role.
- **`focusable="false"` on decorative SVG**, alongside `aria-hidden="true"`.
- **Multiple `<nav>` elements each need a label.** Do not mix in-page fragments
  and cross-page links in one list — they behave differently and a user cannot
  tell which is which.
- **No live region for scroll position.** An announcement on every section
  crossing makes a page unusable with a screen reader.
- **Never move focus on scroll.** It is disorienting, and on touch it is hostile.

## Motion, Contrast, and Forced Colors

Handle these by remapping tokens at `:root` (see Styling Standards), plus:

- Remove purely decorative effects under `prefers-reduced-motion`, and under
  `prefers-contrast: more` if they reduce contrast.
- `scroll-behavior: smooth` must live inside a
  `@media (prefers-reduced-motion: no-preference)` guard.
- Test forced-colors in **real** Windows High Contrast. DevTools emulation
  misses `forced-color-adjust` behaviour on backgrounds.

## Targets and Reflow

- Interactive targets: **44x44 CSS px**. SC 2.5.8's floor is 24x24; 44 is the
  right number for a thumb.
- No 2D scrolling at 320 CSS px equivalent (SC 1.4.10). Wide content — tables,
  diagrams, code — scrolls inside its own `overflow-x: auto` container, and if
  that container can scroll it needs `role="region"` and `tabindex="0"` so the
  scroll is keyboard-reachable.
- Fluid type must keep a `rem` term in the middle `clamp()` argument. A pure-`vw`
  middle is an SC 1.4.4 resize-text failure.
- Code blocks are exempt from reflow — do not wrap code by default.

## Content Requirements

- **Enforce alt text in the schema**, so a missing alt is a build error rather
  than a review comment.
- A decorative image adjacent to text that already names it takes `alt=""`.
  Repeating the name is noise.
- Long-form body copy is not italic — extended italics measurably slow reading
  and are worse for dyslexic readers.

## Anti-Patterns

- `outline: none`
- A `:hover` style with no `:focus-within` or `:focus-visible` counterpart
- `<footer>` inside `<main>`
- More than one `<h1>` on a page
- `aria-label` as the only accessible name on an icon-only control
- `aria-current="page"` for an in-page fragment
- `list-style: none` without `role="list"`
- State signalled by colour alone, or by `font-weight`
- An unlabelled `<nav>` when more than one exists
- A contrast claim with no test behind it

## Remember

> "Prefer the correct element over the correct attribute. Every hover affordance
> needs a focus counterpart. Colour is never the only signal. Landmarks and
> heading counts break silently, so assert them in a test."

## Related Rules

- [Styling Standards](mdc:styling.mdc) - For tokens and the forced-colors remap
- [E2E Testing Standards](mdc:testing-e2e-standards.mdc) - For axe scans and role queries
- [Astro Standards](mdc:astro.mdc) - For component patterns that preserve semantics
