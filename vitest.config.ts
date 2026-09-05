/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

/**
 * Tiered testing, per rules/TESTING_UNIT_STANDARDS.md:
 *   Tier 1  src/lib/**, src/scripts/**  -- 100% enforced. Pure logic.
 *   Tier 2  components, layouts, pages  -- no unit tests, EXCLUDED from coverage
 *                                          so the threshold is not a lie.
 *   Tier 3  tests/*.spec.ts             -- Playwright.
 *
 * `astro build` is the real content gate: it runs zod over every entry.
 */
export default getViteConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/lib/**/*.ts", "src/scripts/**/*.ts"],
      exclude: ["**/*.test.ts", "src/lib/images.ts"],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
