import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import {
  collectTags,
  isPublished,
  selectByTag,
  selectLatest,
  selectPublished,
  sortPostsByDate,
} from "./posts";

type Post = CollectionEntry<"blog">;

const post = (id: string, pubDate: string, draft: boolean, tags: string[] = []): Post =>
  ({ id, data: { pubDate: new Date(pubDate), draft, tags } }) as unknown as Post;

const older = post("older", "2024-01-01", false, ["css"]);
const newer = post("newer", "2026-01-01", false, ["css", "a11y"]);
const middle = post("middle", "2025-01-01", false, ["Astro"]);
const unpublished = post("draft", "2027-01-01", true, ["css"]);
const all = [older, newer, middle, unpublished];

describe("sortPostsByDate", () => {
  it("orders newest first", () => {
    expect(sortPostsByDate([older, newer, middle]).map((p) => p.id)).toEqual([
      "newer",
      "middle",
      "older",
    ]);
  });

  it("does not mutate its input", () => {
    const input = [older, newer];
    sortPostsByDate(input);
    expect(input.map((p) => p.id)).toEqual(["older", "newer"]);
  });
});

describe("isPublished", () => {
  it("is true only when draft is explicitly false", () => {
    expect(isPublished(newer)).toBe(true);
    expect(isPublished(unpublished)).toBe(false);
  });
});

describe("selectPublished", () => {
  it("drops drafts and sorts newest first", () => {
    expect(selectPublished(all).map((p) => p.id)).toEqual(["newer", "middle", "older"]);
  });

  it("returns an empty array when everything is a draft", () => {
    expect(selectPublished([unpublished])).toEqual([]);
  });
});

describe("selectByTag", () => {
  it("matches case-insensitively", () => {
    expect(selectByTag(all, "CSS").map((p) => p.id)).toEqual(["newer", "older"]);
    expect(selectByTag(all, "astro").map((p) => p.id)).toEqual(["middle"]);
  });

  it("never surfaces a draft, even on a matching tag", () => {
    expect(selectByTag(all, "css").map((p) => p.id)).not.toContain("draft");
  });

  it("is empty for an unknown tag", () => {
    expect(selectByTag(all, "rust")).toEqual([]);
  });
});

describe("collectTags", () => {
  it("returns a sorted, de-duplicated tag list from published posts only", () => {
    // localeCompare is case-insensitive collation, so "a11y" precedes "Astro".
    expect(collectTags(all)).toEqual(["a11y", "Astro", "css"]);
  });

  it("is empty when there are no published posts", () => {
    expect(collectTags([unpublished])).toEqual([]);
  });
});

describe("selectLatest", () => {
  it("takes the n newest published posts", () => {
    expect(selectLatest(all, 2).map((p) => p.id)).toEqual(["newer", "middle"]);
  });

  it("returns everything when n exceeds the count", () => {
    expect(selectLatest(all, 99)).toHaveLength(3);
  });

  it("returns nothing for a zero or negative count", () => {
    expect(selectLatest(all, 0)).toEqual([]);
    expect(selectLatest(all, -3)).toEqual([]);
  });
});
