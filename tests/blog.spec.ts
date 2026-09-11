import { expect, test } from "@playwright/test";

test.describe("blog", () => {
  test("the index lists published posts", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("link", { name: "Local Storage Options" })).toBeVisible();
    await expect(page.getByText("No published posts yet.")).toHaveCount(0);
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

  test("the post body fills the available detail width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/blog/local-storage-options");
    const [main, prose] = await Promise.all([
      page.getByRole("main").boundingBox(),
      page.locator(".prose").boundingBox(),
    ]);

    expect(prose?.width).toBeGreaterThan((main?.width ?? 0) * 0.95);
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
