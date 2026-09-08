import { describe, expect, it } from "vitest";
import { matchesOption, multiSelectPlacement, selectionSummary } from "./MultiSelect";

describe("multi-select", () => {
  it("searches options by case-insensitive substring and ignores surrounding spaces", () => {
    expect(matchesOption("TypeScript", " SCRIPT ")).toBe(true);
    expect(matchesOption("React", " ")).toBe(true);
    expect(matchesOption("React", "Vue")).toBe(false);
  });

  it("summarizes empty and multiple selections", () => {
    expect(selectionSummary(0, "All tags")).toBe("All tags");
    expect(selectionSummary(1, "All tags")).toBe("1 selected");
    expect(selectionSummary(10, "All tags")).toBe("10 selected");
  });

  it("opens below a trigger with sufficient space", () => {
    expect(
      multiSelectPlacement(
        { top: 100, bottom: 144, left: 20, width: 240 },
        { width: 320, height: 800 },
        12,
      ),
    ).toEqual({
      width: 240,
      left: 20,
      edge: 156,
      maxHeight: 632,
      opensAbove: false,
    });
  });

  it("opens upward and clamps the horizontal position near the viewport edge", () => {
    expect(
      multiSelectPlacement(
        { top: 600, bottom: 644, left: 200, width: 240 },
        { width: 320, height: 700 },
        12,
      ),
    ).toEqual({
      width: 240,
      left: 68,
      edge: 112,
      maxHeight: 576,
      opensAbove: true,
    });
  });

  it("shrinks an oversized trigger to fit a narrow viewport", () => {
    expect(
      multiSelectPlacement(
        { top: 0, bottom: 44, left: -20, width: 600 },
        { width: 320, height: 400 },
        12,
      ),
    ).toEqual({
      width: 296,
      left: 12,
      edge: 56,
      maxHeight: 332,
      opensAbove: false,
    });
  });
});
