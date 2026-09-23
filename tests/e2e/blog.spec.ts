import { expect, test } from "@playwright/test";
import { getExpectedResultText, getPublishedPostData } from "./helpers/posts";

test.describe("blog", () => {
  test("the index lists published posts", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("link", { name: "Local Storage Options" })).toBeVisible();
    await expect(page.getByText("No published posts yet.")).toHaveCount(0);
  });

  test("the index uses the portfolio filter-and-results layout", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/blog");
    const { count } = await getPublishedPostData(page);
    const filters = page.getByRole("complementary", { name: "Filter posts" });
    const results = page.getByRole("region", { name: "Post results" });
    await expect(filters).toBeVisible();
    await expect(results.getByRole("article")).toHaveCount(count);
    await expect(results.getByRole("status")).toHaveText(getExpectedResultText(count));
    await expect(page.locator('.post-card[data-variant="featured"]')).toHaveCount(0);

    const firstArticleWithImage = results.getByRole("article").locator("img").first();
    const hasImages = (await firstArticleWithImage.count()) > 0;
    if (hasImages) {
      await expect(firstArticleWithImage).toBeAttached({ timeout: 10000 });
      expect((await firstArticleWithImage.boundingBox())?.width).toBeCloseTo(96, 0);
    }
  });

  test("combines title, description, and body search with any selected tag", async ({ page }) => {
    const { posts } = await getPublishedPostData(page);
    const localStoragePosts = posts.filter((p) => p.title.includes("Local Storage"));

    await page.goto("/blog");
    const results = page.getByRole("region", { name: "Post results" });
    const search = page.getByRole("searchbox", { name: "Search posts" });

    await search.fill("tradeoffs are not obvious");
    await expect(
      results.getByRole("heading", {
        name: localStoragePosts[0]?.title ?? "Local Storage Options",
      }),
    ).toBeVisible();

    const reviewPost = posts.find((p) => p.title.includes("Review") || p.title.includes("Pro"));
    if (reviewPost) {
      await search.fill("review");
      await expect(results.getByRole("heading", { name: reviewPost.title })).toBeVisible();
    }

    await search.fill("");
    await page.getByRole("button", { name: /^Tags / }).click();
    await page.getByRole("searchbox", { name: "Search tags" }).fill("agents");
    const agentsCheckbox = page.getByRole("checkbox", { name: "agents", exact: true });
    await agentsCheckbox.click();
    await agentsCheckbox.press("Escape");
    const agentsCount = await results.getByRole("article").count();
    await expect(results.getByRole("article")).toHaveCount(agentsCount);

    await search.fill("Effectively");
    await expect
      .poll(() => results.getByRole("article").count(), {
        timeout: 5000,
        intervals: [100, 200, 500],
      })
      .toBeLessThan(agentsCount);
    const searchFilteredCount = await results.getByRole("article").count();
    expect(searchFilteredCount).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(search).toHaveValue("");
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
    await expect(results.getByRole("status")).toHaveText(getExpectedResultText(posts.length));
  });

  test("uses a modal filter drawer on narrow screens", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto("/blog");
    const opener = page.getByRole("button", { name: "Filters", exact: true });
    await expect(page.getByRole("complementary", { name: "Filter posts" })).toHaveCount(0);
    await opener.click();

    const drawer = page.getByRole("dialog", { name: "Filter posts" });
    await expect(drawer).toBeVisible();

    await drawer.getByRole("searchbox", { name: "Search posts" }).fill("Local Storage");
    await expect(drawer.getByRole("status")).toHaveText(/^\d+ of \d+ posts?$/);
    await drawer.getByRole("button", { name: "View results" }).click();

    await expect(drawer).not.toBeVisible();
    await expect(opener).toBeFocused();
    const results = page.getByRole("region", { name: "Post results" });
    const count = await results.getByRole("article").count();
    expect(count).toBeGreaterThan(0);
  });

  test("a published post builds to a stable URL", async ({ page }) => {
    const response = await page.goto("/blog/local-storage-options");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Local Storage Options");
  });

  test("a published post is indexable", async ({ page }) => {
    await page.goto("/blog/local-storage-options");
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test("a published post has no draft badge", async ({ page }) => {
    await page.goto("/blog/local-storage-options");
    await expect(page.getByText("Draft", { exact: true })).toHaveCount(0);
  });

  test("offers network-specific article sharing", async ({ page }) => {
    await page.goto("/blog/local-storage-options");
    const sharing = page.getByRole("navigation", { name: "Share this article" });
    const destinations = {
      LinkedIn: /^https:\/\/www\.linkedin\.com\/sharing\/share-offsite\//,
      Reddit: /^https:\/\/www\.reddit\.com\/submit\?/,
      X: /^https:\/\/x\.com\/intent\/tweet\?/,
      Bluesky: /^https:\/\/bsky\.app\/intent\/compose\?/,
      Facebook: /^https:\/\/www\.facebook\.com\/sharer\/sharer\.php\?/,
      Email: /^mailto:\?/,
    };
    await expect(sharing).toHaveCount(1);
    for (const toolbar of await sharing.all()) {
      await expect(toolbar.getByRole("link")).toHaveCount(6);
      await expect(toolbar.locator("svg")).toHaveCount(7);
      await expect(toolbar.locator("ul")).toHaveCSS("list-style-type", "none");
      for (const [name, href] of Object.entries(destinations)) {
        await expect(toolbar.getByRole("link", { name, exact: true })).toHaveAttribute(
          "href",
          href,
        );
      }
    }
  });

  test("uses native sharing when available", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data: ShareData) => {
          (window as Window & { __shared?: ShareData }).__shared = data;
        },
      });
    });
    await page.goto("/blog/local-storage-options");
    await page.getByRole("button", { name: "Share" }).first().click();
    const shared = await page.evaluate(
      () => (window as Window & { __shared?: ShareData }).__shared,
    );
    expect(shared).toEqual({
      title: "Local Storage Options",
      url: "https://stephenandrewdesigns.com/blog/local-storage-options/",
    });
  });

  test("copies the article link when native sharing is unavailable", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    });
    await page.goto("/blog/local-storage-options");
    const share = page.getByRole("button", { name: "Share" }).first();
    await share.click();
    await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "https://stephenandrewdesigns.com/blog/local-storage-options/",
    );
  });

  test("the sharing toolbar reflows with accessible targets", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/blog/local-storage-options");
    const sharing = page.getByRole("navigation", { name: "Share this article" });
    const controls = [
      ...(await sharing.getByRole("button").all()),
      ...(await sharing.getByRole("link").all()),
    ];
    for (const control of controls) {
      const box = await control.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    expect(await sharing.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    await expect(sharing).toHaveCSS("flex-direction", "row");
    await expect(sharing.locator("svg").first()).toHaveCSS("width", "18px");

    const summary = page.getByRole("complementary", { name: "Article summary" });
    const readingShare = page.locator("[data-share-sticky]");
    for (const width of [600, 1024]) {
      await page.setViewportSize({ width, height: 800 });
      await expect(readingShare).toBeHidden();
      const heroOrMasthead = page.locator(".post-hero, .post-masthead");
      const [headerBox, heroBox, summaryBox, proseBox] = await Promise.all([
        page.locator(".post-header").boundingBox(),
        heroOrMasthead.boundingBox(),
        summary.boundingBox(),
        page.locator(".prose").boundingBox(),
      ]);
      if (!headerBox || !heroBox || !summaryBox || !proseBox) {
        throw new Error("Article layout must be visible");
      }
      // Hero/masthead and content should be roughly aligned with header (allow small differences)
      expect(Math.abs(summaryBox.width - headerBox.width)).toBeLessThanOrEqual(16);
      expect(Math.abs(proseBox.width - headerBox.width)).toBeLessThanOrEqual(16);
      expect(summaryBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height);
      expect(summaryBox.y + summaryBox.height).toBeLessThanOrEqual(heroBox.y + heroBox.height);
    }

    await summary.evaluate((element) => {
      window.scrollTo(0, element.getBoundingClientRect().bottom + window.scrollY + 1);
    });
    await expect(readingShare).toBeHidden();

    await page.setViewportSize({ width: 1440, height: 800 });
    await expect(readingShare).toBeVisible();
    await expect(readingShare).toHaveCSS("position", "sticky");
    await expect(readingShare).toHaveCSS("flex-direction", "column");
    await expect(readingShare.locator("ul")).toHaveCSS("flex-direction", "column");
    const railBox = await readingShare.boundingBox();
    if (!railBox) throw new Error("Reading toolbar must be visible");
    const wideProseBox = await page.locator(".prose").boundingBox();
    if (!wideProseBox) throw new Error("Article body must be visible");
    expect(railBox.x).toBeGreaterThanOrEqual(wideProseBox.x + wideProseBox.width);
  });

  test("a post page has exactly one h1", async ({ page }) => {
    await page.goto("/blog/local-storage-options");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("all code blocks use JavaScript syntax highlighting", async ({ page }) => {
    await page.goto("/blog/local-storage-options");
    const codeBlocks = page.locator("figure.frame pre");
    await expect(codeBlocks.first()).toBeVisible();
    expect(
      await codeBlocks.evaluateAll((blocks) =>
        blocks.every((block) => block.getAttribute("data-language") === "javascript"),
      ),
    ).toBe(true);
  });

  test("the hero spans the page while its content aligns with the post body", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto("/blog/local-storage-options");

    const hasHero = (await page.locator(".post-hero").count()) > 0;
    const heroOrMasthead = page.locator(hasHero ? ".post-hero" : ".post-masthead");

    const [boundaryBreadcrumb, boundaryTitle, boundaryProse] = await Promise.all([
      page.getByRole("link", { name: "All posts" }).boundingBox(),
      page.getByRole("heading", { level: 1 }).boundingBox(),
      page.locator(".prose").boundingBox(),
    ]);

    expect(boundaryTitle?.x).toBeCloseTo(boundaryBreadcrumb?.x ?? 0, 0);
    expect(boundaryTitle?.x).toBeLessThan(boundaryProse?.x ?? 0);

    await page.setViewportSize({ width: 1440, height: 900 });
    const [main, breadcrumb, title, hero, summary, prose] = await Promise.all([
      page.getByRole("main").boundingBox(),
      page.getByRole("link", { name: "All posts" }).boundingBox(),
      page.getByRole("heading", { level: 1 }).boundingBox(),
      heroOrMasthead.boundingBox(),
      page.getByRole("complementary", { name: "Article summary" }).boundingBox(),
      page.locator(".prose").boundingBox(),
    ]);

    expect(title?.x).toBeCloseTo(breadcrumb?.x ?? 0, 0);
    expect(title?.x).toBeCloseTo(prose?.x ?? 0, 0);
    if (hasHero) {
      expect(hero?.x).toBeLessThan(title?.x ?? 0);
      expect((hero?.x ?? 0) + (hero?.width ?? 0)).toBeGreaterThan(
        (summary?.x ?? 0) + (summary?.width ?? 0),
      );
      expect(summary?.y).toBeGreaterThanOrEqual(hero?.y ?? 0);
      expect((summary?.y ?? 0) + (summary?.height ?? 0)).toBeLessThanOrEqual(
        (hero?.y ?? 0) + (hero?.height ?? 0),
      );
    }
    expect((summary?.x ?? 0) + (summary?.width ?? 0)).toBeCloseTo(
      (prose?.x ?? 0) + (prose?.width ?? 0),
      0,
    );
    expect(prose?.width).toBeLessThan(main?.width ?? 0);
    expect((prose?.x ?? 0) + (prose?.width ?? 0) / 2).toBeCloseTo(
      (main?.x ?? 0) + (main?.width ?? 0) / 2,
      0,
    );
  });

  test("uses the masthead layout with a gradient when a post has no hero image", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/blog/review/");

    const masthead = page.locator(".post-masthead");
    await expect(page.locator(".post-hero")).toHaveCount(0);
    await expect(masthead).toHaveCSS("background-image", /linear-gradient/);

    const [breadcrumb, title, summary, prose] = await Promise.all([
      page.getByRole("link", { name: "All posts" }).boundingBox(),
      page.getByRole("heading", { level: 1 }).boundingBox(),
      page.getByRole("complementary", { name: "Article summary" }).boundingBox(),
      page.locator(".prose").boundingBox(),
    ]);

    expect(title?.x).toBeCloseTo(breadcrumb?.x ?? 0, 0);
    expect(title?.x).toBeCloseTo(prose?.x ?? 0, 0);
    expect((summary?.x ?? 0) + (summary?.width ?? 0)).toBeCloseTo(
      (prose?.x ?? 0) + (prose?.width ?? 0),
      0,
    );
  });

  test("rss.xml is well-formed and includes published posts", async ({ request }) => {
    const response = await request.get("/rss.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("xml");
    const body = await response.text();
    expect(body).toContain("<rss");
    expect(body).toContain("<channel>");
    expect(body).toContain("Local Storage Options");
  });

  test("detail pages expose global and contextual navigation", async ({ page }) => {
    await page.goto("/blog/local-storage-options");

    const primary = page.getByRole("navigation", { name: "Primary" });
    await expect(primary.getByRole("link", { name: "Home" })).toHaveCount(0);
    await expect(primary.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
    await expect(primary.getByRole("link", { name: "Writing" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    await expect(primary.getByRole("link")).toHaveCount(2);

    const social = page.getByRole("navigation", { name: "Social links" });
    await expect(social.getByRole("link")).toHaveCount(4);
    for (const name of ["GitHub", "LinkedIn", "NPM", "Resume"]) {
      await expect(social.getByRole("link", { name, exact: true })).toBeVisible();
    }

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "All posts" })).toBeVisible();
    const [breadcrumbX, titleX] = await Promise.all([
      breadcrumb
        .getByRole("link", { name: "All posts" })
        .evaluate((element) => element.getBoundingClientRect().x),
      page
        .getByRole("heading", { level: 1 })
        .evaluate((element) => element.getBoundingClientRect().x),
    ]);
    expect(breadcrumbX).toBe(titleX);
  });

  test("keeps the sidebar fixed while list pages fill the remaining width", async ({ page }) => {
    for (const width of [1024, 1440, 1800]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/blog", "/projects"]) {
        await page.goto(path);
        const [sidebar, shell] = await Promise.all([
          page.getByRole("banner").boundingBox(),
          page.locator(".page-shell").boundingBox(),
        ]);
        expect(sidebar?.width).toBe(64);
        expect(shell?.x).toBe(64);
        expect(shell?.width).toBe(width - 64);
      }
    }
  });

  test("uses a mobile masthead and a left-aligned desktop sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/blog/local-storage-options");

    const header = page.locator('.floating-header[data-variant="page"]');
    const social = page.getByRole("navigation", { name: "Social links", includeHidden: true });
    const primary = page.getByRole("navigation", { name: "Primary" });
    await expect(header).toBeVisible();
    await expect(header.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    await expect(social).toBeHidden();
    expect(await primary.evaluate((element) => getComputedStyle(element).position)).toBe("fixed");
    await expect(primary.getByRole("link", { name: "Writing" })).toBeVisible();
    await expect(primary.getByRole("link")).toHaveCount(2);

    await page.setViewportSize({ width: 1800, height: 900 });
    expect(await primary.evaluate((element) => getComputedStyle(element).position)).toBe("static");
    await expect(social).toBeVisible();
    await expect(primary.locator("svg")).toHaveCount(2);
    await expect(social.locator("svg")).toHaveCount(4);
    await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeVisible();

    const [headerBox, shellBox] = await Promise.all([
      header.boundingBox(),
      page.locator(".page-shell").boundingBox(),
    ]);
    expect(headerBox?.width).toBeLessThan(80);
    expect(headerBox?.height).toBe(900);
    expect(shellBox?.x).toBeCloseTo((headerBox?.x ?? 0) + (headerBox?.width ?? 0), 0);
    await expect(social.locator("ul")).toHaveCSS("list-style-type", "none");
    await expect(social.locator("ul")).toHaveCSS("padding-inline-start", "0px");
    for (const link of await header.getByRole("link").all()) {
      const linkBox = await link.boundingBox();
      expect(linkBox?.x).toBeGreaterThanOrEqual(headerBox?.x ?? 0);
      expect((linkBox?.x ?? 0) + (linkBox?.width ?? 0)).toBeLessThanOrEqual(
        (headerBox?.x ?? 0) + (headerBox?.width ?? 0),
      );
    }

    const writing = primary.getByRole("link", { name: "Writing" });
    await writing.hover();
    await expect(writing.locator(".floating-tooltip")).toBeVisible();
    await writing.focus();
    await expect(writing.locator(".floating-tooltip")).toBeVisible();
  });
});
