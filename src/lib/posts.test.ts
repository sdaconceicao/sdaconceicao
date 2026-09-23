import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import {
  collectTags,
  isPublished,
  matchesPost,
  postResultCount,
  selectByTag,
  selectFeaturedArticle,
  selectLatest,
  selectPublished,
  sortPostsByDate,
} from "./posts";

type Post = CollectionEntry<"blog">;

const post = (
  id: string,
  pubDate: string,
  draft: boolean,
  tags: string[] = [],
  featured = false,
): Post => ({ id, data: { pubDate: new Date(pubDate), draft, tags, featured } }) as unknown as Post;

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

describe("post filters", () => {
  const searchable = {
    title: "Poképendium patterns",
    description: "A practical component guide",
    body: "Use a reducer for predictable state.",
    tags: ["React", "TypeScript"],
  };

  it("searches title, description, and body regardless of case, accents, or spacing", () => {
    expect(matchesPost(searchable, "  POKEPENDIUM ", [])).toBe(true);
    expect(matchesPost(searchable, "COMPONENT GUIDE", [])).toBe(true);
    expect(matchesPost(searchable, " reducer ", [])).toBe(true);
    expect(matchesPost(searchable, "missing", [])).toBe(false);
  });

  it("matches any selected tag and combines tags with the text query", () => {
    expect(matchesPost(searchable, "", ["CSS", "React"])).toBe(true);
    expect(matchesPost(searchable, "state", ["TypeScript"])).toBe(true);
    expect(matchesPost(searchable, "state", ["CSS"])).toBe(false);
    expect(matchesPost(searchable, "missing", ["React"])).toBe(false);
    expect(matchesPost(searchable, "", [])).toBe(true);
  });

  it("formats empty, singular, and plural result counts", () => {
    expect(postResultCount(0, 0)).toBe("0 of 0 posts");
    expect(postResultCount(1, 1)).toBe("1 of 1 post");
    expect(postResultCount(2, 5)).toBe("2 of 5 posts");
  });
});

describe("selectFeaturedArticle", () => {
  it("selects a featured published article regardless of date and excludes it from the rest", () => {
    const featuredOlder = post("featured", "2023-01-01", false, [], true);
    const result = selectFeaturedArticle([...all, featuredOlder]);

    expect(result.featuredPost?.id).toBe("featured");
    expect(result.otherPosts.map((p) => p.id)).toEqual(["newer", "middle", "older"]);
  });

  it("uses the newest published article when none is featured", () => {
    const result = selectFeaturedArticle(all);

    expect(result.featuredPost?.id).toBe("newer");
    expect(result.otherPosts.map((p) => p.id)).toEqual(["middle", "older"]);
  });

  it("ignores featured drafts", () => {
    const featuredDraft = post("featured-draft", "2028-01-01", true, [], true);
    expect(selectFeaturedArticle([...all, featuredDraft]).featuredPost?.id).toBe("newer");
  });

  it("returns no featured or remaining articles when none are published", () => {
    expect(selectFeaturedArticle([unpublished])).toEqual({
      featuredPost: undefined,
      otherPosts: [],
    });
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
