import { expect, test } from "@playwright/test";

test.describe("seo and metadata", () => {
  test("the homepage sets a canonical url", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://stephenandrewdesigns.com/",
    );
  });

  test("open graph tags are present", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(1);
  });

  test("a post is marked up as an article with a published time", async ({ page }) => {
    await page.goto("/blog/local-storage-options");
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
    await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(1);
  });

  test("the title carries the brand without duplicating it", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Stephen Andrew Designs");
    await page.goto("/blog");
    await expect(page).toHaveTitle("Writing · Stephen Andrew Designs");
  });

  test("the sitemap exists and excludes admin", async ({ request }) => {
    const index = await request.get("/sitemap-index.xml");
    expect(index.status()).toBe(200);
    const body = await index.text();
    expect(body).toContain("sitemap");
    expect(body).not.toContain("/admin");
  });

  test("robots.txt disallows the CMS and the oauth routes", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("Disallow: /admin/");
    expect(body).toContain("Disallow: /api/");
  });

  test("the CMS shell is served and pinned with an SRI hash", async ({ request }) => {
    const response = await request.get("/admin/");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("decap-cms@3.15.1");
    // SRI is what stops the /admin bundle -- which holds a repo-write token --
    // from being swapped out underneath us.
    expect(body).toMatch(/integrity="sha384-[A-Za-z0-9+/=]+"/);
    expect(body).toContain('name="robots" content="noindex, nofollow"');
  });

  test("the Decap config uses an exact-origin base_url", async ({ request }) => {
    const response = await request.get("/admin/config.yml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    // No www, no trailing slash, no path. Decap compares this with ===.
    expect(body).toContain("base_url: https://stephenandrewdesigns.com\n");
    expect(body).toContain("auth_endpoint: api/auth");
  });

  test("the webmanifest has a real name", async ({ request }) => {
    const response = await request.get("/site.webmanifest");
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest.name).toBe("Stephen Andrew Designs");
    expect(manifest.name.length).toBeGreaterThan(0);
  });
});
