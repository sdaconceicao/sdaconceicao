import { describe, expect, it } from "vitest";
import { buildImageKey } from "./images";

/**
 * resolveEntryImage's default argument reads an import.meta.glob map, so only
 * buildImageKey is unit-tested here; the injection path is exercised via the
 * key builder plus a hand-rolled module map below.
 */
describe("buildImageKey", () => {
  it("maps a bare Decap filename onto a root-relative module key", () => {
    // Decap writes "hero.jpg" -- no "./" -- because path.join strips it.
    expect(buildImageKey("src/content/blog/my-post/index.mdx", "hero.jpg")).toBe(
      "/src/content/blog/my-post/hero.jpg",
    );
  });

  it("tolerates a hand-authored './' prefix", () => {
    expect(buildImageKey("src/content/blog/my-post/index.mdx", "./hero.jpg")).toBe(
      "/src/content/blog/my-post/hero.jpg",
    );
  });

  it("tolerates a leading slash on the filename", () => {
    expect(buildImageKey("src/content/blog/my-post/index.mdx", "/hero.jpg")).toBe(
      "/src/content/blog/my-post/hero.jpg",
    );
  });

  it("collapses duplicate slashes", () => {
    expect(buildImageKey("src/content/blog/p/index.mdx", "a.png")).not.toMatch(/\/\//);
  });

  it("handles a nested post directory", () => {
    expect(buildImageKey("src/content/blog/2026/deep/index.mdx", "cover.webp")).toBe(
      "/src/content/blog/2026/deep/cover.webp",
    );
  });
});

describe("resolveEntryImage", () => {
  const meta = { src: "/hashed.png", width: 1, height: 1, format: "png" } as never;
  const modules = { "/src/content/blog/p/hero.png": { default: meta } };

  it("resolves a known image through an injected module map", async () => {
    const { resolveEntryImage } = await import("./images");
    expect(resolveEntryImage("src/content/blog/p/index.mdx", "hero.png", modules)).toBe(meta);
  });

  it("is undefined for an unknown filename", async () => {
    const { resolveEntryImage } = await import("./images");
    expect(resolveEntryImage("src/content/blog/p/index.mdx", "nope.png", modules)).toBeUndefined();
  });

  it("is undefined when either argument is missing", async () => {
    const { resolveEntryImage } = await import("./images");
    expect(resolveEntryImage(undefined, "hero.png", modules)).toBeUndefined();
    expect(resolveEntryImage("src/content/blog/p/index.mdx", undefined, modules)).toBeUndefined();
  });
});
