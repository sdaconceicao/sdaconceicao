import { describe, expect, it } from "vitest";
import { hrefToId, pickActiveSection } from "./scroll-spy";

const ORDER = ["about", "experience", "projects"];

describe("pickActiveSection", () => {
  it("returns the only visible section", () => {
    expect(pickActiveSection(ORDER, ["experience"])).toBe("experience");
  });

  // The reason this is a pure function: IntersectionObserver batches entries in
  // an arbitrary order, so a fast scroll would otherwise activate whichever one
  // happened to be reported first.
  it("prefers document order when several sections are visible at once", () => {
    expect(pickActiveSection(ORDER, ["projects", "about"])).toBe("about");
  });

  it("ignores visible ids that are not nav targets", () => {
    expect(pickActiveSection(ORDER, ["footer", "projects"])).toBe("projects");
  });

  it("is undefined when nothing is visible", () => {
    expect(pickActiveSection(ORDER, [])).toBeUndefined();
  });

  it("is undefined when there are no sections", () => {
    expect(pickActiveSection([], ["about"])).toBeUndefined();
  });

  it("accepts a Set as well as an array", () => {
    expect(pickActiveSection(ORDER, new Set(["projects"]))).toBe("projects");
  });
});

describe("hrefToId", () => {
  it("strips the leading hash", () => {
    expect(hrefToId("#about")).toBe("about");
  });

  it("rejects a null href", () => {
    expect(hrefToId(null)).toBeUndefined();
  });

  it("rejects a cross-page href", () => {
    expect(hrefToId("/blog")).toBeUndefined();
  });

  it("rejects a bare hash with no fragment", () => {
    expect(hrefToId("#")).toBeUndefined();
  });

  it("rejects an empty string", () => {
    expect(hrefToId("")).toBeUndefined();
  });
});
