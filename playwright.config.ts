import { defineConfig, devices } from "@playwright/test";

/**
 * Deliberately pinned to its own port with reuseExistingServer: false.
 *
 * The default (reuse whatever is on 4321) means a stray `astro dev` gets adopted
 * silently, and the suite then tests a different server than the one it built --
 * which shows up as a scatter of unrelated 404s rather than an honest error.
 * A dedicated port keeps the run isolated from any dev server.
 */
const PORT = 4322;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html"], ["github"]] : "html",
  use: { baseURL: `http://localhost:${PORT}`, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // astro preview is unavailable once an adapter is configured, so the suite
    // runs against the real built output via a tiny static server.
    command: "pnpm build && pnpm serve",
    url: `http://localhost:${PORT}`,
    env: { PORT: String(PORT) },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
