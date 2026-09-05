import { expect, test } from "@playwright/test";

test.describe("blog", () => {
  test("the index omits drafts", async ({ page }) => {
    await page.goto("/blog");
    // The only seeded post is a draft, so it must not be listed here...
    await expect(page.getByRole("link", { name: /Local Storage Options/ })).toHaveCount(0);
    await expect(page.getByText("No published posts yet.")).toBeVisible();
  });

  test("a draft post still builds to a previewable URL", async ({ page }) => {
    // ...but it IS reachable, so a Decap save produces something to look at.
    const response = await page.goto("/blog/local-storage-options");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Local Storage Options");
  });

  test("a draft post is noindexed", async ({ page }) => {
    await page.goto("/blog/local-storage-options");
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
  });

  test("a draft post is visibly badged as a draft", async ({ page }) => {
    await page.goto("/blog/local-storage-options");
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  });

  test("a post page has exactly one h1", async ({ page }) => {
    await page.goto("/blog/local-storage-options");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("code blocks render through expressive-code", async ({ page }) => {
    await page.goto("/blog/local-storage-options");
    await expect(page.locator("figure.frame").first()).toBeVisible();
  });

  test("rss.xml is well-formed and excludes drafts", async ({ request }) => {
    const response = await request.get("/rss.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("xml");
    const body = await response.text();
    expect(body).toContain("<rss");
    expect(body).toContain("<channel>");
    expect(body).not.toContain("Local Storage Options");
  });

  test("detail pages expose global and contextual navigation", async ({ page }) => {
    await page.goto("/blog/local-storage-options");

    const primary = page.getByRole("navigation", { name: "Primary" });
    await expect(primary.getByRole("link", { name: "Home" })).toHaveCount(0);
    await expect(primary.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
    await expect(primary.getByRole("link", { name: "Experience" })).toHaveAttribute(
      "href",
      "/Resume.pdf",
    );
    await expect(primary.getByRole("link", { name: "Writing" })).toHaveAttribute(
      "aria-current",
      "location",
    );

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

  test("uses the full-width single-column page shell", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const path of ["/blog", "/blog/local-storage-options"]) {
      await page.goto(path);
      await expect(page.locator(".rail")).toHaveCount(0);
      const shell = await page.locator(".page-shell").boundingBox();
      expect(shell?.width).toBeGreaterThan(1440 * 0.9);
    }
  });

  test("uses a desktop masthead and fixed mobile navigation dock", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/blog/local-storage-options");

    const header = page.locator('.floating-header[data-variant="page"]');
    await expect(
      page.getByRole("navigation", { name: "Social links", includeHidden: true }),
    ).toHaveCount(0);
    const primary = page.getByRole("navigation", { name: "Primary" });
    await expect(header).toBeVisible();
    await expect(header.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(await primary.evaluate((element) => getComputedStyle(element).position)).toBe("fixed");
    await expect(primary.getByRole("link", { name: "Writing" })).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 900 });
    expect(await primary.evaluate((element) => getComputedStyle(element).position)).toBe("static");
    await expect(primary.locator("svg")).toHaveCount(3);
  });
});
