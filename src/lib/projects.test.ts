import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import { primaryHref, selectFeatured, sortProjects } from "./projects";

type Project = CollectionEntry<"projects">;

const project = (
  id: string,
  title: string,
  featured: boolean,
  order = 999,
  url?: string,
  repo?: string,
): Project => ({ id, data: { title, featured, order, url, repo } }) as unknown as Project;

describe("sortProjects", () => {
  it("puts featured projects first", () => {
    const list = [project("b", "B", false), project("a", "A", true)];
    expect(sortProjects(list).map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("then respects explicit order", () => {
    const list = [project("second", "Z", true, 2), project("first", "A", true, 1)];
    expect(sortProjects(list).map((p) => p.id)).toEqual(["first", "second"]);
  });

  it("then falls back to title so the sort is fully deterministic", () => {
    const list = [project("z", "Zebra", true, 1), project("a", "Apple", true, 1)];
    expect(sortProjects(list).map((p) => p.id)).toEqual(["a", "z"]);
  });

  it("does not mutate its input", () => {
    const list = [project("b", "B", false), project("a", "A", true)];
    sortProjects(list);
    expect(list.map((p) => p.id)).toEqual(["b", "a"]);
  });
});

describe("selectFeatured", () => {
  it("returns featured projects only", () => {
    const list = [project("a", "A", true), project("b", "B", false)];
    expect(selectFeatured(list).map((p) => p.id)).toEqual(["a"]);
  });

  it("is empty when nothing is featured", () => {
    expect(selectFeatured([project("b", "B", false)])).toEqual([]);
  });
});

describe("primaryHref", () => {
  it("prefers a live url over a repo", () => {
    expect(primaryHref(project("a", "A", true, 1, "https://live.test", "https://repo.test"))).toBe(
      "https://live.test",
    );
  });

  it("falls back to the repo", () => {
    expect(primaryHref(project("a", "A", true, 1, undefined, "https://repo.test"))).toBe(
      "https://repo.test",
    );
  });

  it("is undefined when neither exists", () => {
    expect(primaryHref(project("a", "A", true))).toBeUndefined();
  });
});
