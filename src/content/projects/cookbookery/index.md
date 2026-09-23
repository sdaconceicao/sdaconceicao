---
title: Cookbookery
description: An online recipe tracking app.
# TODO: add the live url and/or repo -- the schema requires at least one.
repo: https://github.com/cookbookery
tech:
  - React
  - Node.js
  - Express
  - Tanstack Start
  - PostgreSQL
featured: false
image: ./cover.png
imageAlt: "Edit Recipe Screen"
images: 
  - src: ./cook-1.png
    alt: "List View"

status: archived
order: 4
---

Cookbookery is a web based recipe directory that I originally built with React and Express and am now using to explore modern application architecture and incremental frontend migration.

The application has a PostgreSQL backed Express API and is being rebuilt with TanStack Start and my Lago design system. Rather than replacing the existing frontend all at once, the new application is being developed through vertical slices, allowing individual features to migrate while preserving the existing API and using the legacy application as a behavioral reference. This provides a practical environment for applying an accessibility-first design system to an existing application while exploring modern full stack React architecture.

The project is organized as a pnpm monorepo with separate API, web, mobile, and shared packages. The development workflow uses strict TypeScript, Biome, Vitest, Testing Library, Vite, and GitHub Actions to automate type checking, testing, builds, and code quality.
