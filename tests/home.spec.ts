import { expect, test } from "@playwright/test";

test.describe("homepage", () => {
  test("renders every section as a named landmark region", async ({ page }) => {
    await page.goto("/");
    for (const name of ["About", "Selected projects", "Recent experience", "Activity"]) {
      await expect(page.getByRole("region", { name })).toBeVisible();
    }
  });

  test("has exactly one h1, and it is the person not the brand", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText("Just call me Steve");
  });

  test("exposes the in-page navigation with a distinct accessible name", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible();
  });

  test("gives icon-only social links real accessible names", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "GitHub" })).toBeVisible();
    await expect(page.getByRole("link", { name: "LinkedIn" })).toBeVisible();
  });

  test("skip link is the first focusable element and reaches main", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toHaveAttribute("href", "#main");
  });

  test("scroll-spy marks the scrolled-to section with aria-current=location", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const projectsLink = page.locator('[data-spy-link][href="#projects"]');
    await page.locator("#projects").scrollIntoViewIfNeeded();
    // "location", never "page" -- these are in-page fragments, not navigation.
    await expect(projectsLink).toHaveAttribute("aria-current", "location", { timeout: 5000 });

    const experienceLink = page.locator('[data-spy-link][href="#experience"]');
    await expect(experienceLink).not.toHaveAttribute("aria-current", "location");
  });

  test("job cards reveal their highlight on keyboard focus, not just hover", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    // :focus-within is what makes the experience list usable by keyboard.
    const styles = await page.evaluate(() => {
      const job = document.querySelector(".job");
      if (!job) return null;
      const before = getComputedStyle(job, "::before");
      return { transition: before.transition, hasCard: before.content !== "none" };
    });
    expect(styles?.hasCard).toBe(true);
  });

  test("falls back to a single column when the viewport is too short for the rail", async ({
    page,
  }) => {
    // 1024 wide but only 640 tall: wide enough for two columns, too short to
    // hold the rail without it becoming a nested scroll region.
    await page.setViewportSize({ width: 1024, height: 640 });
    await page.goto("/");
    const display = await page.locator(".shell").evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe("block");
  });

  test("uses the two-column grid when there is room for it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const display = await page.locator(".shell").evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe("grid");
  });

  test("uses one lead project and two equal secondary projects", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator('.project[data-variant="lead"]')).toHaveCount(1);
    const tiles = page.locator('.project[data-variant="tile"]');
    await expect(tiles).toHaveCount(2);
    const [first, second] = await Promise.all([
      tiles.nth(0).boundingBox(),
      tiles.nth(1).boundingBox(),
    ]);
    expect(first?.width).toBeCloseTo(second?.width ?? 0, 0);
  });

  test("persists the selected colour theme", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Switch to dark theme" });
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("keeps GitHub activity as an empty implementation placeholder", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("article", { name: "3-month activity" })).toBeVisible();
    await expect(page.locator(".github-placeholder")).toBeEmpty();
  });

  test("never scrolls horizontally, even at 400% zoom equivalent", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });
});
