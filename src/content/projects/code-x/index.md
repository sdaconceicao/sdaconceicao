---
title: Code-X / Lago
description: A React design system built on react-aria-components, providing accessible components, design tokens, and guidelines for building applications.
repo: https://github.com/sdaconceicao/lago
# TODO: point this at the published Storybook. The old site linked a /storybook
# route that never existed -- this is the link it was reaching for.
# url: https://
tech:
  - React
  - TypeScript
  - react-aria-components
  - Vite
  - Storybook
  - Playwright
featured: true
status: wip
order: 1
---

An accessibility-first design system. Every component is built on
react-aria-components, so keyboard interaction, focus management, and ARIA
semantics are correct by construction rather than bolted on. Ships design tokens
as cascade layers, which means consumers retheme by redefining custom properties
instead of fighting specificity.
