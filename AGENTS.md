# Repository Instructions

## What this is

`stephenandrewdesigns.com` — the personal portfolio of Stephen da Conceicao.
A **static Astro site** deployed to Vercel. Not a monorepo, no workspaces, no
React, no backend.

```
src/
  assets/          images processed by astro:assets
  components/      .astro components (seo/ layout/ content/ ui/)
  content/         blog (MDX, CMS-managed) · jobs · projects (local files)
  layouts/         BaseLayout · HomeLayout · PageLayout
  lib/             pure functions
  pages/           routes, incl. api/auth + api/callback (the only SSR routes)
  scripts/         browser logic extracted for testability
  styles/          tokens · reset · base · global
  content.config.ts   collection schemas
  site.ts          identity, nav, socials — single source of truth
public/admin/      Decap CMS shell + config
tests/             Playwright specs
rules/             coding standards — read these
```

## Standards

**Read the applicable file in `rules/` before writing code.** Each is mirrored by
a thin pointer in `.cursor/rules/` with the globs it applies to.

| File | Covers |
| --- | --- |
| `rules/INTERACTION_STANDARDS.md` | How to communicate: be curt, challenge assumptions, offer alternatives |
| `rules/STYLING.md` | Tokens, cascade layers, motion, logical properties, contrast contracts |
| `rules/ACCESSIBILITY.md` | Landmarks, headings, keyboard, accessible names, colour independence |
| `rules/ASTRO.md` | Content collections, component and script patterns, whitespace, toolchain |
| `rules/PURE_FUNCTIONS.md` | Extracting logic out of components |
| `rules/TESTING_UNIT_STANDARDS.md` | Vitest — note the tiered **Coverage Scope** |
| `rules/TESTING_E2E_STANDARDS.md` | Playwright only, `getByRole` first, axe scans |
| `rules/GITHUB_ACTIONS.md` | Workflow conventions |

## Commands

```bash
pnpm dev            # dev server on :4321
pnpm cms:dev        # decap-server, for local CMS authoring
pnpm build          # production build (also validates all content via zod)
pnpm serve          # serve the built output
pnpm lint           # biome check
pnpm typecheck      # astro check && tsc --noEmit
pnpm test           # vitest
pnpm test:coverage  # vitest with the coverage thresholds
pnpm test:e2e       # playwright
```

pnpm only — `packageManager` is pinned and CI uses `--frozen-lockfile`.

## Repo-specific facts

Things that are true of *this repository* and are not inferable from the code:

- **`README.md` is the GitHub profile README.** This repo is named after the
  account, so that file renders on the profile page. Never rewrite it as project
  documentation. CI asserts it is non-empty.
- **`docs/` is stale GitHub Pages build output**, not documentation and not a
  source directory. It stays until the DNS cutover completes, then it is deleted.
  See `DEPLOY.md`.
- **`master` is the production branch**, and it is simultaneously the Decap
  `branch:` target and Vercel's production branch. Renaming it is a three-place
  change; do it deliberately and on its own.
- **The CMS commits straight to `master`** — editorial workflow is off, so every
  save deploys. New posts default to `draft: true`.
- **`public/admin/index.html` pins Decap with an SRI hash**, because that bundle
  carries a token with write access to this repo. Recompute the hash on every
  version bump; never use a floating range there.
- **`base_url` in `public/admin/config.yml` must be the exact origin.** Decap
  compares it with `===`, and a mismatch hangs CMS login with no error at all.

Deployment, DNS, CMS setup, and the Decap failure modes are in `DEPLOY.md`.
