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
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible();
  });

  test("gives social links real accessible names", async ({ page }) => {
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
    await expect(page.locator('[data-spy-link][aria-current="location"]')).toHaveCount(1);
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

  test("aligns the first home section with the desktop rail", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const contentTop = (selector: string) =>
      page.locator(selector).evaluate((element) => {
        const style = getComputedStyle(element);
        return element.getBoundingClientRect().top + Number.parseFloat(style.paddingBlockStart);
      });
    expect(await contentTop("#projects")).toBe(await contentTop(".rail"));
  });

  test("uses the full row for the profile at the tablet breakpoint", async ({ page }) => {
    await page.setViewportSize({ width: 980, height: 1200 });
    await page.goto("/");
    const [rail, shell] = await Promise.all([
      page.locator(".rail").boundingBox(),
      page.locator(".shell").boundingBox(),
    ]);
    expect(rail?.width).toBeGreaterThan((shell?.width ?? 0) * 0.9);
    await expect(page.getByRole("navigation", { name: "On this page" })).toBeHidden();
    expect(
      (await page.getByRole("heading", { name: "Selected projects" }).boundingBox())?.y,
    ).toBeLessThan(700);
  });

  test("brings selected work into the first phone viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const projectsHeading = await page
      .getByRole("heading", { name: "Selected projects" })
      .boundingBox();
    expect(projectsHeading?.y).toBeLessThan(800);
  });

  test("shows the header and social bar after the phone hero scrolls away", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Page sections" });
    const socials = page.getByRole("navigation", { name: "Social links" });
    await expect(nav).toBeHidden();
    await expect(socials).toBeHidden();
    await page.locator("#experience").scrollIntoViewIfNeeded();
    await expect(nav).toBeVisible();
    await expect(socials).toBeInViewport();
    await expect(nav.getByRole("link")).toHaveCount(3);
    await expect(socials.getByRole("link")).toHaveCount(4);
    for (const name of ["GitHub", "LinkedIn", "NPM", "Resume"]) {
      await expect(socials.getByRole("link", { name, exact: true })).toBeVisible();
    }
    const bounds = await socials.boundingBox();
    expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeCloseTo(800, 0);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(nav).toBeHidden();
    await expect(socials).toBeHidden();
  });

  test("removes the timeline gutter from one-column job cards", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await expect(page.locator(".job-period").first()).toBeHidden();
  });

  test("keeps both homepage actions on one line at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    for (const name of ["View work", /Résumé/]) {
      const link = page.getByRole("link", { name });
      const lineHeight = Number.parseFloat(
        await link.evaluate((el) => getComputedStyle(el).lineHeight),
      );
      const labelHeight = await link
        .locator("span")
        .first()
        .evaluate((el) => el.getBoundingClientRect().height);
      expect(labelHeight).toBeLessThanOrEqual(lineHeight + 1);
    }
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

  test("only shows navigation labels and the theme control when they fit", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    await page.locator("#experience").scrollIntoViewIfNeeded();
    await expect(page.locator(".floating-label").first()).toBeHidden();
    await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeHidden();

    await page.setViewportSize({ width: 640, height: 800 });
    await expect(page.locator(".floating-label").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeHidden();

    await page.setViewportSize({ width: 1045, height: 900 });
    await page.goto("/");
    await expect(page.locator(".social-label").first()).toBeHidden();
    await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator(".social-label").first()).toBeVisible();
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
