import { test, type Page } from "@playwright/test";
import { matchesPost, postResultCount } from "../../../src/lib/posts";
import { findNarrowingQuery, findUniqueQuery } from "./query";

export interface PublishedPost {
  title: string;
  href: string;
  description: string;
  body: string;
  tags: string[];
  hasThumbnail: boolean;
}

export interface PublishedPostData {
  count: number;
  tags: string[];
  posts: PublishedPost[];
}

let cache: Promise<PublishedPostData> | null = null;

const parseTags = (value: string | null): string[] => {
  if (!value) return [];
  try {
    const tags: unknown = JSON.parse(value);
    return Array.isArray(tags) && tags.every((tag) => typeof tag === "string") ? tags : [];
  } catch {
    return [];
  }
};

const scrape = async (page: Page): Promise<PublishedPostData> => {
  await page.goto("/blog");
  const empty = page.getByText("No published posts yet.", { exact: true });
  if ((await empty.count()) > 0) {
    return { count: 0, tags: [], posts: [] };
  }

  const results = page.getByRole("region", { name: "Post results" });
  const cards = await results.locator("[data-post-card]").all();
  const posts: PublishedPost[] = [];

  for (const card of cards) {
    posts.push({
      title: (await card.getAttribute("data-post-title")) ?? "",
      description: (await card.getAttribute("data-post-description")) ?? "",
      body: (await card.getAttribute("data-post-body")) ?? "",
      tags: parseTags(await card.getAttribute("data-post-tags")),
      href: (await card.getByRole("heading").getByRole("link").getAttribute("href")) ?? "",
      hasThumbnail: (await card.locator("img").count()) > 0,
    });
  }

  return {
    count: posts.length,
    tags: [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) => a.localeCompare(b)),
    posts,
  };
};

export const requirePublishedPost = async (page: Page): Promise<PublishedPost> => {
  const { posts } = await getPublishedPostData(page);
  const post = posts[0];
  test.skip(!post?.href, "no published posts");
  if (!post?.href) throw new Error("no published posts");
  return post;
};

export const getPublishedPostData = async (page: Page): Promise<PublishedPostData> => {
  cache ??= scrape(page).catch((error) => {
    cache = null;
    throw error;
  });
  const data = await cache;
  if (!/\/blog\/?$/.test(new URL(page.url()).pathname)) {
    await page.goto("/blog");
  }
  return data;
};

export const expectedPostCount = (visible: number, total: number): string =>
  postResultCount(visible, total);

export const findUniquePostQuery = (
  posts: readonly PublishedPost[],
): { query: string; post: PublishedPost } | undefined => {
  const match = (post: PublishedPost, query: string) => matchesPost(post, query, []);
  const fromTitle = findUniqueQuery(posts, (post) => post.title, match);
  if (fromTitle) return { query: fromTitle.query, post: fromTitle.item };
  const fromCopy = findUniqueQuery(posts, (post) => `${post.description} ${post.body}`, match);
  return fromCopy ? { query: fromCopy.query, post: fromCopy.item } : undefined;
};

export const findNarrowingPostQuery = (posts: readonly PublishedPost[]) => {
  const found = findNarrowingQuery(
    posts,
    (post) => `${post.title} ${post.description} ${post.body}`,
    (post, query) => matchesPost(post, query, []),
  );
  return found ? { query: found.query, remaining: found.remaining } : undefined;
};

export const findPartialPostTag = (
  posts: readonly PublishedPost[],
): { tag: string; matching: PublishedPost[] } | undefined => {
  const tags = [...new Set(posts.flatMap((post) => post.tags))];
  for (const tag of tags) {
    const matching = posts.filter((post) => post.tags.includes(tag));
    if (matching.length > 0 && matching.length < posts.length) {
      return { tag, matching };
    }
  }
  const tag = tags[0];
  return tag ? { tag, matching: posts.filter((post) => post.tags.includes(tag)) } : undefined;
};

export const findPostWithHero = async (
  page: Page,
  posts: readonly PublishedPost[],
  hasHero: boolean,
): Promise<PublishedPost | undefined> => {
  const preferred = hasHero
    ? posts.filter((post) => post.hasThumbnail)
    : posts.filter((post) => !post.hasThumbnail);
  for (const post of [...preferred, ...posts.filter((item) => !preferred.includes(item))]) {
    if (!post.href) continue;
    await page.goto(post.href);
    const heroCount = await page.locator(".post-hero").count();
    if (heroCount > 0 === hasHero) return post;
  }
};

export const findPostWithCodeBlocks = async (
  page: Page,
  posts: readonly PublishedPost[],
): Promise<PublishedPost | undefined> => {
  for (const post of posts) {
    if (!post.href) continue;
    await page.goto(post.href);
    if ((await page.locator("figure.frame pre").count()) > 0) return post;
  }
};
