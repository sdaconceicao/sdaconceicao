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

  test("the compact rail offers a way back", async ({ page }) => {
    await page.goto("/blog/local-storage-options");
    await expect(page.getByRole("link", { name: /All posts/ })).toBeVisible();
  });
});
