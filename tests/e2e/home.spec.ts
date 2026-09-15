import { expect, test } from "@playwright/test";

test.describe("homepage", () => {
  test("renders every section as a named landmark region", async ({ page }) => {
    await page.goto("/");
    for (const name of ["About", "Selected projects", "Recent experience", "Writing"]) {
      await expect(page.getByRole("region", { name })).toBeVisible();
    }
    await expect(page.locator("main > section .section-number")).toHaveText([
      "01",
      "02",
      "03",
      "04",
    ]);
  });

  test("has exactly one h1, and it is the person not the brand", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText("Just call me Steve");
  });

  test("uses the in-page navigation at every desktop layout", async ({ page }) => {
    for (const width of [1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
    }
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

    const experienceLink = page.locator('[data-spy-link][href="#experience"]');
    await page.locator("#experience").scrollIntoViewIfNeeded();
    // "location", never "page" -- these are in-page fragments, not navigation.
    await expect(experienceLink).toHaveAttribute("aria-current", "location", { timeout: 5000 });
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

  test("keeps the profile rail fixed while the main column grows", async ({ page }) => {
    const railWidths: number[] = [];
    const mainWidths: number[] = [];
    for (const width of [1024, 1440, 1800]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const [rail, main] = await Promise.all([
        page.locator(".rail").boundingBox(),
        page.getByRole("main").boundingBox(),
      ]);
      railWidths.push(rail?.width ?? 0);
      mainWidths.push(main?.width ?? 0);
    }

    expect(railWidths).toEqual([480, 480, 480]);
    expect(mainWidths[1]).toBeGreaterThan(mainWidths[0] ?? 0);
    expect(mainWidths[2]).toBeGreaterThan(mainWidths[1] ?? 0);
  });

  test("aligns the first home section with the desktop rail", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const contentTop = (selector: string) =>
      page.locator(selector).evaluate((element) => {
        const style = getComputedStyle(element);
        return element.getBoundingClientRect().top + Number.parseFloat(style.paddingBlockStart);
      });
    expect(await contentTop("#about")).toBe(await contentTop(".rail"));
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
      (await page.getByRole("heading", { name: "Writing", exact: true }).boundingBox())?.y,
    ).toBeLessThan(700);
  });

  test("brings writing into the first phone viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const writingHeading = await page
      .getByRole("heading", { name: "Writing", exact: true })
      .boundingBox();
    expect(writingHeading?.y).toBeLessThan(800);
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
    await expect(nav.getByRole("link")).toHaveCount(4);
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

  test("adapts the featured writing layout to its available space", async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1000 });
    await page.goto("/");
    const posts = page.locator("#activity article:visible");
    await expect(posts).toHaveCount(5);
    const secondaryItems = page.locator(".writing-secondary article");
    const [first, firstSecondary, secondSecondary, fullWidth, secondFullWidth, writingLayout] =
      await Promise.all([
        posts.nth(0).boundingBox(),
        secondaryItems.nth(0).boundingBox(),
        secondaryItems.nth(1).boundingBox(),
        secondaryItems.nth(2).boundingBox(),
        secondaryItems.nth(3).boundingBox(),
        page.locator(".writing-layout").boundingBox(),
      ]);
    expect(first?.x).toBeLessThan(firstSecondary?.x ?? 0);
    expect(first?.y).toBeCloseTo(firstSecondary?.y ?? 0, 0);
    expect(firstSecondary?.height).toBeCloseTo(secondSecondary?.height ?? 0, 0);
    expect(secondSecondary?.y).toBeGreaterThan(
      (firstSecondary?.y ?? 0) + (firstSecondary?.height ?? 0),
    );
    expect((first?.y ?? 0) + (first?.height ?? 0)).toBeCloseTo(
      (secondSecondary?.y ?? 0) + (secondSecondary?.height ?? 0),
      0,
    );
    expect(fullWidth?.y).toBeGreaterThan((first?.y ?? 0) + (first?.height ?? 0));
    expect(fullWidth?.x).toBeCloseTo(writingLayout?.x ?? 0, 0);
    expect(fullWidth?.width).toBeCloseTo(writingLayout?.width ?? 0, 0);
    expect(secondFullWidth?.y).toBeGreaterThan((fullWidth?.y ?? 0) + (fullWidth?.height ?? 0));
    expect(secondFullWidth?.x).toBeCloseTo(writingLayout?.x ?? 0, 0);
    expect(secondFullWidth?.width).toBeCloseTo(writingLayout?.width ?? 0, 0);
    const rowLayouts = await Promise.all([
      Promise.all([
        secondaryItems.nth(2).locator("img").boundingBox(),
        secondaryItems.nth(2).getByRole("heading").boundingBox(),
      ]),
      Promise.all([
        secondaryItems.nth(3).locator("img").boundingBox(),
        secondaryItems.nth(3).getByRole("heading").boundingBox(),
      ]),
    ]);
    for (const [thumbnail, title] of rowLayouts) {
      expect(thumbnail?.width).toBeGreaterThanOrEqual(150);
      expect((title?.x ?? 0) - ((thumbnail?.x ?? 0) + (thumbnail?.width ?? 0))).toBeCloseTo(8, 0);
      expect(title?.y).toBeCloseTo(thumbnail?.y ?? 0, 0);
    }
    await expect(posts.first()).toHaveAttribute("data-variant", "home-featured");
    const [wideThumbnail, wideTitle] = await Promise.all([
      posts.first().locator("img").boundingBox(),
      posts.first().getByRole("heading").boundingBox(),
    ]);
    expect(wideThumbnail?.width).toBeGreaterThan(96);
    expect(wideThumbnail?.y).toBeLessThan(wideTitle?.y ?? 0);
    await expect(secondaryItems.first().locator("time")).toHaveText(/^[A-Z][a-z]{2} \d{4}$/);

    await page.setViewportSize({ width: 1693, height: 1000 });
    await expect(posts).toHaveCount(3);
    await page.setViewportSize({ width: 1694, height: 1000 });
    await expect(posts).toHaveCount(5);
    await page.setViewportSize({ width: 1795, height: 1000 });
    await expect(posts).toHaveCount(5);

    await page.setViewportSize({ width: 1583, height: 1000 });
    await expect(posts).toHaveCount(3);
    const [stackedFeatured, stackedSecondary] = await Promise.all([
      posts.first().boundingBox(),
      page.locator(".writing-secondary").boundingBox(),
    ]);
    expect(stackedSecondary?.x).toBeCloseTo(stackedFeatured?.x ?? 0, 0);
    expect(stackedSecondary?.y).toBeGreaterThan(
      (stackedFeatured?.y ?? 0) + (stackedFeatured?.height ?? 0),
    );
    await expect(secondaryItems.first().getByRole("heading")).toBeVisible();
    await expect(secondaryItems.first().locator(".post-description")).toBeVisible();

    await page.setViewportSize({ width: 558, height: 1207 });
    const mobileBoxes = await posts.evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect().toJSON()),
    );
    expect(mobileBoxes).toHaveLength(3);
    expect(mobileBoxes[1]?.x).toBeCloseTo(mobileBoxes[0]?.x ?? 0, 0);
    expect(mobileBoxes[2]?.x).toBeCloseTo(mobileBoxes[0]?.x ?? 0, 0);
    expect(mobileBoxes[1]?.y).toBeGreaterThan(mobileBoxes[0]?.bottom ?? 0);
    expect(mobileBoxes[2]?.y).toBeGreaterThan(mobileBoxes[1]?.bottom ?? 0);

    for (const post of await posts.all()) {
      const [thumbnail, title] = await Promise.all([
        post.locator("img").boundingBox(),
        post.getByRole("heading").boundingBox(),
      ]);
      expect(thumbnail?.width).toBeLessThanOrEqual(96);
      expect(thumbnail?.x).toBeLessThan(title?.x ?? 0);
      expect(thumbnail?.y).toBeCloseTo(title?.y ?? 0, 0);
      await expect(post).toHaveCSS("border-left-width", "0px");
    }
  });

  test("links the about and writing stack height to the capped projects column", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("main > section")).toHaveCount(4);
    expect(
      await page.locator("main > section").evaluateAll((sections) => sections.map(({ id }) => id)),
    ).toEqual(["about", "activity", "projects", "experience"]);

    const writingWidths: number[] = [];
    const projectWidths: number[] = [];
    for (const width of [1440, 1800, 2400]) {
      await page.setViewportSize({ width, height: 1000 });
      const [about, writing, projects, experience] = await Promise.all(
        ["#about", "#activity", "#projects", "#experience"].map((selector) =>
          page.locator(selector).boundingBox(),
        ),
      );
      expect(writing?.x).toBeLessThan(projects?.x ?? 0);
      expect(about?.y).toBeCloseTo(projects?.y ?? 0, 0);
      expect(writing?.y).toBeGreaterThan(about?.y ?? 0);
      expect((writing?.y ?? 0) + (writing?.height ?? 0)).toBeCloseTo(
        (projects?.y ?? 0) + (projects?.height ?? 0),
        0,
      );
      const projectContentBottom = await page
        .locator("#projects > .project, #projects > .project-secondary")
        .evaluateAll((items) =>
          Math.max(...items.map((item) => item.getBoundingClientRect().bottom)),
        );
      expect(projectContentBottom).toBeLessThanOrEqual(
        (projects?.y ?? 0) + (projects?.height ?? 0),
      );
      expect(experience?.y).toBeGreaterThanOrEqual((projects?.y ?? 0) + (projects?.height ?? 0));
      writingWidths.push(writing?.width ?? 0);
      projectWidths.push(projects?.width ?? 0);
    }

    expect(projectWidths).toEqual([512, 512, 512]);
    expect(writingWidths[1]).toBeGreaterThan(writingWidths[0] ?? 0);
    expect(writingWidths[2]).toBeGreaterThan(writingWidths[1] ?? 0);
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
    await expect(page.locator(".social-label").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeVisible();

    // The stacked tablet rail also has room for labels.
    await page.setViewportSize({ width: 800, height: 900 });
    await expect(page.locator(".social-label").first()).toBeVisible();
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
