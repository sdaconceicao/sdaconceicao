import { test } from "@playwright/test";

export interface PublishedPostData {
  count: number;
  tags: string[];
  posts: { title: string; tags: string[] }[];
}

let cachedData: PublishedPostData | null = null;

export async function getPublishedPostData(
  page: import("@playwright/test").Page,
): Promise<PublishedPostData> {
  if (cachedData) {
    return cachedData;
  }

  await page.goto("/blog");
  const results = page.getByRole("region", { name: "Post results" });
  const cards = await results.locator("[data-post-card]").all();
  const count = cards.length;

  const posts: PublishedPostData["posts"] = [];
  for (const card of cards) {
    const title = await card.getAttribute("data-post-title");
    const tagsAttr = await card.getAttribute("data-post-tags");
    const tags = tagsAttr ? JSON.parse(tagsAttr) : [];
    posts.push({ title: title ?? "", tags });
  }

  const tags = [...new Set(posts.flatMap((p) => p.tags))].sort();

  cachedData = { count, tags, posts };
  return cachedData;
}

export async function getPublishedPostCount(
  page: import("@playwright/test").Page,
): Promise<number> {
  const data = await getPublishedPostData(page);
  return data.count;
}

export function getExpectedResultText(count: number): string {
  return `${count} of ${count} ${count === 1 ? "post" : "posts"}`;
}

test.afterEach(() => {
  cachedData = null;
});
