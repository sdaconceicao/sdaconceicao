---
title: Code-X / Lago
description: A React design system built on react-aria-components, providing accessible components, design tokens, and guidelines for building applications.
repo: https://github.com/sdaconceicao/lago
url: https://main--6a4eb38660443c1eee94713d.chromatic.com/
tech:
  - React
  - TypeScript
  - react-aria-components
  - Vite
  - Storybook
  - Playwright
featured: true
image: ./cover.png
imageAlt: "Lago's documentation on Design Tokens"
images:
  - src: ./lago-1.png
    alt: "Size examples"
  - src: ./lago-2.png
    alt: "Light Mode"  
status: wip
order: 1
---

Lago is an accessibility first design system for building consistent, reusable, and adaptable React applications. Built on React Aria Components, it treats keyboard interaction, focus management, and ARIA semantics as foundational parts of component design rather than accessibility enhancements added after the fact.

The system provides a collection of accessible UI components, design tokens, and usage guidelines that help teams build cohesive product experiences without sacrificing flexibility. Its token architecture uses CSS cascade layers, allowing consuming applications to customize visual styles by redefining tokens and applying their own design language without fighting preset component styling.

I built Lago to explore the architecture and tooling required to create a reusable design system that can support different products and visual identities. The project combines accessible component primitives with a theming model, Storybook documentation, and a development workflow designed to support consistent implementation and ongoing evolution.
