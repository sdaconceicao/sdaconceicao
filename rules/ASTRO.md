# Astro Standards

## Quick Reference

This rule works with:

- **Styling Standards** - Scoped `<style>` blocks are the styling unit
- **Accessibility Standards** - Component patterns that preserve semantics
- **Pure Functions Guide** - Where logic belongs instead of a template

## Core Principles

1. **Ship no client JS by default** - Interactivity is opt-in and measured
2. **Templates render; logic lives in modules** - Anything testable moves out
3. **Content is schema-validated at build time** - A bad entry fails the build,
   not production
4. **Scoped styles, unlayered** - Encapsulation with zero runtime

## Project Layout

```
src/
  components/      .astro components, grouped by role
  content/         collections (one directory per collection)
  layouts/         page shells
  lib/             pure functions — testable, 100% covered
  pages/           routes
  scripts/         browser logic extracted for testability
  styles/          tokens, reset, base, global
  content.config.ts    NOT src/content/config.ts
```

`astro build` is the most valuable check in CI: it runs the content schemas
across every entry, so a malformed CMS commit fails before it can be served.

## Content Collections

Astro 6+ removed legacy collections. Every collection declares a loader:

```ts
const blog = defineCollection({
  loader: glob({ pattern: "**/index.mdx", base: "./src/content/blog" }),
  schema: z.object({ /* ... */ }),
});
```

Required conventions:

- Config lives at **`src/content.config.ts`**, not `src/content/config.ts`
- No `type: 'content'` / `type: 'data'`
- Use `id`, not `slug`; the source path is `filePath`
- Use `render(entry)`, not `entry.render()`
- Use `getEntry()`, not `getEntryBySlug()`

### Validate invariants in the schema

Push every rule you would otherwise enforce in review into `.refine()`, so it
becomes a build error:

```ts
.refine((data) => !data.heroImage || data.heroImageAlt.trim().length > 0, {
  message: "heroImageAlt is required when heroImage is set",
  path: ["heroImageAlt"],
})
```

Alt text, date ordering, and "needs at least one of these fields" all belong
here.

### `image()` vs. a string plus a resolver

`image()` requires a Vite-resolvable specifier (`./hero.jpg`). Use it for
hand-authored content.

**A CMS that writes a bare filename cannot use `image()`.** In that case the
field is `z.string()` and a helper in `src/lib/` maps the filename back to an
eagerly-globbed `ImageMetadata`. Comment the schema field explaining why —
"simplifying" it back to `image()` breaks the build with an opaque resolution
error, and it looks like a cleanup.

## Components

- One `.astro` file per component; scoped `<style>` at the bottom
- Declare a `Props` interface; destructure from `Astro.props`
- **Move anything testable into `src/lib/`.** A template with a sort comparator
  or a date calculation inline is a template you cannot test.
- Prefer a `variant` prop over near-duplicate components

### Styles inside components

Scoped styles do not reach slotted or `set:html` content. Use `:global()` on a
descendant of a scoped root — this gives containment without polluting the
document:

```astro
<div class="prose"><slot /></div>

<style>
  .prose :global(a) { color: var(--accent); }
</style>
```

Prefer `<style>` with `:global()` over `<style is:global>`.

### Scripts inside components

Astro `<script>` tags are bundled, deferred, and **deduplicated across
instances** — a component used ten times ships one copy.

- Write every script **idempotent**, and re-bind on `astro:page-load` so a
  future `<ClientRouter />` costs nothing
- Guard on capability and preference before doing work
  (`matchMedia("(pointer: fine)")`, `prefers-reduced-motion`)
- Set frequently-updated custom properties **on the element, not `:root`** —
  writing to `:root` invalidates style for every inheriting node
- Extract the decision logic into `src/scripts/` and unit-test it; leave only
  DOM wiring in the component

## Rendering and Output

- `output: "static"` is the default. Keep it.
- To make a couple of routes dynamic, add an adapter and set
  `export const prerender = false` on **those routes only**
- Set `site` explicitly — canonical URLs, the sitemap, and any origin allowlist
  depend on it, and it falls back to the request origin when unset

### Whitespace is significant

Astro's compiler collapses whitespace between inline elements. A link that
begins a line loses the space before it:

```astro
<!-- Renders as "system,Code-X" -->
<p>My own system,
  <a href="#x">Code-X</a>, is built on that.</p>

<!-- Correct -->
<p>My own system,{" "}
  <a href="#x">Code-X</a>, is built on that.</p>
```

Use an explicit `{" "}`. This produces no error and no warning — only wrong text
— so it is worth a regression test on any paragraph with an inline link.

Also note: the compiler no longer silently repairs invalid HTML. An unclosed tag
is a build error.

### Reserved paths

Do not create `src/fetch.ts` — Astro reserves it.

## Toolchain

- **Pin `typescript` to the range `@astrojs/check` supports.** `typescript@latest`
  regularly moves outside it and breaks `astro check` with a confusing error.
- Do not exclude `.astro/` in `tsconfig.json`. `exclude` filters `include`, and
  `.astro/types.d.ts` is what declares `astro:content`, `astro:env/server`, and
  `ImportMeta.glob` — excluding it makes every virtual module "not found".
- Run `astro check` **and** `tsc --noEmit`: the first covers `.astro` files and
  runs `astro sync`, the second catches config and script files.
- A linter that only parses `.astro` frontmatter will report template-only
  variables as unused. Disable those specific rules for `*.astro` rather than
  adding `_` prefixes or ignore comments — `astro check` already typechecks
  those files properly.

## Anti-Patterns

- Logic in a template that could live in `src/lib/`
- `src/content/config.ts` instead of `src/content.config.ts`
- `entry.render()` or `getEntryBySlug()`
- A schema invariant enforced by convention instead of `.refine()`
- Writing high-frequency custom properties to `:root`
- A component script that breaks when run twice
- `output: "server"` for a site that is almost entirely static
- Hardcoding an asset path that the bundler hashes

## Remember

> "Templates render, modules compute. Content is validated at build time so bad
> data never ships. Client JS is opt-in, idempotent, and measured — if a feature
> needs a framework, question the feature first."

## Related Rules

- [Styling Standards](mdc:styling.mdc) - For tokens, layers, and scoped styles
- [Accessibility Standards](mdc:accessibility.mdc) - For semantics in components
- [Pure Functions Guide](mdc:pure-functions.mdc) - For extracting logic out of templates
- [Unit Testing Standards](mdc:testing-unit-standards.mdc) - For the tiered coverage scope
