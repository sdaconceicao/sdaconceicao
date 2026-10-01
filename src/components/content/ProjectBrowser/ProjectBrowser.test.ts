import { describe, expect, it } from "vitest";
import { projectResultCount } from "./ProjectBrowser";

describe("project results", () => {
  it("formats counts for empty, singular, and plural collections", () => {
    expect(projectResultCount(0, 0)).toBe("0 of 0 projects");
    expect(projectResultCount(0, 1)).toBe("0 of 1 project");
    expect(projectResultCount(1, 4)).toBe("1 of 4 projects");
  });
});
