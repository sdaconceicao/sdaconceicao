import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * The highest-value spec in the suite: this site's pitch is that its author is
 * an accessibility specialist, so a violation here is a credibility problem.
 */

const scan = (page: Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);

test.describe("accessibility", () => {
  test("the homepage has no axe violations", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const results = await scan(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("the homepage has no axe violations on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const results = await scan(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("a blog post has no axe violations", async ({ page }) => {
    await page.goto("/blog/local-storage-options");
    const results = await scan(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("the blog index has no axe violations", async ({ page }) => {
    await page.goto("/blog");
    const results = await scan(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("the 404 page has no axe violations", async ({ page }) => {
    await page.goto("/404");
    const results = await scan(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("every page has one main landmark", async ({ page }) => {
    for (const path of ["/", "/blog", "/blog/local-storage-options"]) {
      await page.goto(path);
      await expect(page.getByRole("main")).toHaveCount(1);
    }
  });

  test("banner and contentinfo landmarks are not swallowed by a wrapper", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
  });

  test("motion is neutralised under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const duration = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--dur").trim(),
    );
    expect(duration).toBe("1ms");
  });

  test("external links announce that they open a new tab", async ({ page }) => {
    await page.goto("/");
    const external = page.locator('a[target="_blank"]');
    const count = await external.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(external.nth(i)).toHaveAttribute("rel", /noopener/);
    }
  });

  test("social links meet the 44px touch target floor", async ({ page }) => {
    await page.goto("/");
    const box = await page.getByRole("link", { name: "GitHub" }).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test("prose links inside body copy are underlined, not colour-only", async ({ page }) => {
    await page.goto("/");
    const decoration = await page
      .locator(".about-prose a")
      .first()
      .evaluate((el) => getComputedStyle(el).textDecorationLine);
    expect(decoration).toContain("underline");
  });
});
