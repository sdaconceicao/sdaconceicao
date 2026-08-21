# Styling Standards

## Quick Reference

This rule works with:

- **Accessibility Standards** - Token remaps are how a11y adaptation happens
- **Astro Standards** - Scoped `<style>` blocks are the unit of encapsulation

## Scope

Plain modern CSS: custom properties, cascade layers, native nesting. No
preprocessor, no utility framework, no CSS-in-JS.

## Core Principles

1. **Tokens are the only source of colour, space, type, and motion** - Never a
   literal value in a component
2. **Global adaptation happens by redefining tokens, never by restating
   properties** - One override point, no specificity fights
3. **Component styles are scoped and unlayered** - Encapsulation without a
   naming convention
4. **Logical properties everywhere** - RTL should be one `dir` attribute
5. **Motion is zeroed once, at the token** - Components never guard it themselves

## Layer Order

```css
@layer reset, tokens, base, utilities;
```

Global sheets are imported into a layer. **Component `<style>` blocks stay
unlayered.** Unlayered rules outrank every layered rule regardless of
specificity, which is the override direction you want: a component can always
adjust its own presentation without `!important` and without escalating
selectors.

Never wrap a component's styles in `@layer` "for consistency" — it inverts the
cascade and the next person reaches for `!important`.

## Tokens

Every colour, space, radius, duration, and type step is a custom property
defined once at `:root`. Components read `var(--fg)`, never `#f5f1f2`.

This is not tidiness. It is the mechanism that makes global accessibility
adaptation possible:

```css
@media (forced-colors: active) {
  :root {
    --bg: Canvas;
    --fg: CanvasText;
    --accent: LinkText;
    --border-strong: ButtonBorder;
    --focus-ring: Highlight;
  }
}
```

Because components only ever read the token, this wins unconditionally — no
layer conflict, no `!important`, no per-component media queries. A hardcoded hex
silently opts that element out of forced-colors, `prefers-contrast`, and any
future theme.

The same mechanism covers `prefers-contrast: more` (raise the AA-only tokens to
AAA) and a future light theme (redefine the semantic tokens; touch nothing else).

### Colour tokens carry a contrast contract

A token's name states where it may be used, and a test enforces it:

| Kind | Constraint |
| --- | --- |
| Body text token | >= 4.5:1 on **every** surface it can land on |
| Muted/metadata token | >= 4.5:1, and never used for body copy |
| Border token | Decorative only unless it clears 3:1 |
| Control-boundary token | >= 3:1 (SC 1.4.11) — a separate token from the decorative border |

**Verify ratios in a test, not in a comment.** A palette that claims AA and a
palette that proves it are different artefacts, and only one of them survives a
redesign. See `src/lib/contrast.test.ts`.

Two traps worth naming, because both are counterintuitive and both are measured:

- A colour that passes on the page background can **fail** on a card surface. A
  token that is only conditionally legible is not a token.
- The text colour on a saturated fill is often the **near-black**, not white.
  Check it rather than assuming.

## Motion

Zero it at the token:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-fast: 1ms;
    --dur: 1ms;
    --dur-slow: 1ms;
  }
}
```

Components then write `transition: opacity var(--dur) var(--ease)` with no media
query of their own. Do not add per-component reduced-motion guards — they are
redundant and they rot.

A blanket `!important` sweep is acceptable **only** as a backstop for
third-party CSS that cannot read your tokens. Keep it in one place and comment
why it exists.

Motion that carries no meaning should be **removed** under reduced motion, not
frozen. A stationary decorative effect reads as a rendering artefact; absence
reads as design.

## Logical Properties

Use `margin-inline`, `padding-block`, `inset-block-start`, `border-inline-start`,
`inline-size`, `block-size`. Never `margin-left`, `top`, `width`.

The payoff is that an RTL locale becomes `dir="rtl"` on `<html>` and nothing
else. Two things logical properties cannot fix, and which need explicit
handling:

- **Directional glyphs** (arrows, chevrons) — flip with `[dir="rtl"] { scale: -1 1 }`
- **X-axis transforms** — `translate` and `scale` are physical

## Elevation

On a dark surface a drop shadow is invisible; on a light surface it becomes the
only elevation cue, creating a theme asymmetry that has to be maintained twice.
Use a **surface step plus a hairline border** instead. Reserve `box-shadow` for
the focus halo.

## Anti-Patterns

- A literal colour, duration, or spacing value inside a component
- `@layer` around a component's own `<style>` block
- `outline: none` anywhere, for any reason
- A per-component `prefers-reduced-motion` block
- Physical properties (`margin-left`, `width`, `top`) in new code
- `!important` outside the single documented third-party backstop
- Nesting deeper than one level
- A contrast ratio asserted in a comment rather than a test
- `box-shadow` for elevation

## Examples

### Good

```css
.card {
  padding: var(--spacing-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background-color: var(--surface-1);
  color: var(--fg-muted);
  transition: opacity var(--dur) var(--ease);
}

.card:hover,
.card:focus-within {
  border-color: var(--border-strong);
}
```

### Avoid

```css
.card {
  padding: 16px;                                   /* not a token */
  border: 1px solid #2a2426;                       /* opts out of forced-colors */
  box-shadow: 0 2px 8px rgb(0 0 0 / 40%);          /* invisible on dark */
  margin-left: 12px;                               /* breaks RTL */
  transition: opacity 200ms ease;                  /* ignores reduced motion */
}

@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }                      /* redundant, already at the token */
}

.card:hover { border-color: #6b6265 !important; }  /* specificity escalation */
```

## Remember

> "Colour, space, and motion come from tokens — always. Global accessibility
> adaptation is a token remap, never a property restatement. Component styles
> are scoped and unlayered so they win without `!important`. Prove contrast in a
> test, not in a comment."

## Related Rules

- [Accessibility Standards](mdc:accessibility.mdc) - For the a11y invariants tokens enable
- [Astro Standards](mdc:astro.mdc) - For scoped styles and `:global()` in components
- [Unit Testing Standards](mdc:testing-unit-standards.mdc) - For asserting contrast ratios
