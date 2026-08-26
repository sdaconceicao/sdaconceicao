import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, grade, meetsNonText, parseHex, relativeLuminance } from "./contrast";

/**
 * These are the palette's guarantees, asserted against the real token file.
 * A palette tweak that regresses accessibility fails here rather than shipping.
 */

const BG = "#0C0A0B";
const SURFACE_1 = "#141113";
const SURFACE_2 = "#1C1719";
const SURFACE_TINT = "#2A1416";
const SURFACES = [BG, SURFACE_1, SURFACE_2, SURFACE_TINT];

const tokens = readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8");

/** Reads a `--name: #hex;` declaration straight out of tokens.css. */
const tokenHex = (name: string): string => {
  const match = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6});`));
  if (!match) throw new Error(`Token --${name} not found as a literal hex in tokens.css`);
  return match[1];
};

describe("contrast primitives", () => {
  it("parses shorthand and longhand hex identically", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("rejects a non-hex value", () => {
    expect(() => parseHex("rebeccapurple")).toThrow(/Not a hex colour/);
  });

  it("anchors luminance at the extremes", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 6);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 6);
  });

  it("reproduces the known black/white ratio of 21:1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 2);
  });

  it("is symmetric in its arguments", () => {
    expect(contrastRatio("#FF5A5A", BG)).toBeCloseTo(contrastRatio(BG, "#FF5A5A"), 10);
  });

  it("grades against the right thresholds for normal and large text", () => {
    expect(grade(7.0)).toBe("AAA");
    expect(grade(4.5)).toBe("AA");
    expect(grade(4.49)).toBe("FAIL");
    expect(grade(4.5, true)).toBe("AAA");
    expect(grade(3, true)).toBe("AA");
    expect(grade(2.99, true)).toBe("FAIL");
  });

  it("applies the 3:1 non-text floor", () => {
    expect(meetsNonText(3)).toBe(true);
    expect(meetsNonText(2.99)).toBe(false);
  });
});

describe("tokens.css ramp values are the ones this suite verifies", () => {
  it.each([
    ["stone-1000", BG],
    ["stone-985", SURFACE_1],
    ["stone-975", SURFACE_2],
    ["red-900", SURFACE_TINT],
    ["red-300", "#ff5a5a"],
    ["red-200", "#ff8a8a"],
    ["red-400", "#ff7a7a"],
    ["red-600", "#a4161a"],
    ["stone-100", "#f5f1f2"],
    ["stone-300", "#b0a7aa"],
    ["stone-500", "#8b8285"],
    ["stone-700", "#6b6265"],
  ])("--%s is %s", (name, expected) => {
    expect(tokenHex(name).toLowerCase()).toBe(expected.toLowerCase());
  });
});

describe("text tokens clear AA on every surface they can land on", () => {
  it.each([
    ["--fg", "#F5F1F2", "AAA"],
    ["--fg-muted", "#B0A7AA", "AAA"],
    ["--fg-dim", "#8B8285", "AA"],
    ["--accent", "#FF5A5A", "AA"],
    ["--accent-hover", "#FF8A8A", "AAA"],
  ] as const)("%s reaches at least %s everywhere", (_name, hex, floor) => {
    for (const surface of SURFACES) {
      const ratio = contrastRatio(hex, surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      if (floor === "AAA") expect(ratio).toBeGreaterThanOrEqual(7);
    }
  });

  it("pins the headline ratios against the page background", () => {
    expect(contrastRatio("#F5F1F2", BG)).toBeCloseTo(17.62, 1);
    expect(contrastRatio("#B0A7AA", BG)).toBeCloseTo(8.42, 1);
    expect(contrastRatio("#8B8285", BG)).toBeCloseTo(5.29, 1);
    expect(contrastRatio("#FF5A5A", BG)).toBeCloseTo(6.45, 1);
    expect(contrastRatio("#FF8A8A", BG)).toBeCloseTo(8.7, 1);
  });
});

describe("the black-and-red trap", () => {
  // Documented so nobody "fixes" the palette back toward a saturated red.
  it("pure #FF0000 passes on the page but FAILS inside a card", () => {
    expect(contrastRatio("#FF0000", BG)).toBeCloseTo(4.94, 1);
    expect(grade(contrastRatio("#FF0000", BG))).toBe("AA");
    expect(contrastRatio("#FF0000", SURFACE_2)).toBeCloseTo(4.43, 1);
    expect(grade(contrastRatio("#FF0000", SURFACE_2))).toBe("FAIL");
  });

  it.each([
    ["#E5484D", 5.04],
    ["#DC2626", 4.09],
    ["#D00000", 3.46],
    ["#C1121F", 3.17],
    ["#A4161A", 2.55],
  ])("the tasteful red %s measures %f on the page", (hex, expected) => {
    expect(contrastRatio(hex, BG)).toBeCloseTo(expected, 1);
  });

  it("every red below #E5484D fails as body text, which is why the ramp lightens", () => {
    for (const hex of ["#DC2626", "#D00000", "#C1121F", "#A4161A"]) {
      expect(grade(contrastRatio(hex, BG))).toBe("FAIL");
    }
  });
});

describe("fills and boundaries (SC 1.4.11)", () => {
  it("the accent fill is a legal boundary against the page", () => {
    expect(meetsNonText(contrastRatio("#FF5A5A", BG))).toBe(true);
  });

  it("brand #A4161A can NEVER be a fill on dark -- this is why it is decorative only", () => {
    expect(meetsNonText(contrastRatio("#A4161A", BG))).toBe(false);
  });

  it("text on the accent fill must be near-black, not white", () => {
    expect(grade(contrastRatio("#0C0A0B", "#FF5A5A"))).not.toBe("FAIL");
    expect(grade(contrastRatio("#FFFFFF", "#FF5A5A"))).toBe("FAIL");
    expect(contrastRatio("#FFFFFF", "#FF5A5A")).toBeCloseTo(3.06, 1);
  });

  it("border-strong holds the 3:1 floor on both the page and a card", () => {
    expect(meetsNonText(contrastRatio("#6B6265", BG))).toBe(true);
    expect(meetsNonText(contrastRatio("#6B6265", SURFACE_2))).toBe(true);
  });

  it("the decorative border is NOT a legal boundary, hence border-strong exists", () => {
    expect(meetsNonText(contrastRatio("#2A2426", BG))).toBe(false);
  });
});

describe("the focus ring must be a dual ring", () => {
  it("the ring alone fails on the accent fill, which is why a halo is required", () => {
    expect(meetsNonText(contrastRatio("#F5F1F2", "#FF5A5A"))).toBe(false);
    expect(contrastRatio("#F5F1F2", "#FF5A5A")).toBeCloseTo(2.73, 1);
  });

  it("the halo carries it: the page background against that same fill passes", () => {
    expect(meetsNonText(contrastRatio(BG, "#FF5A5A"))).toBe(true);
  });

  it("the ring passes on every ordinary surface", () => {
    for (const surface of [BG, SURFACE_1, SURFACE_2, SURFACE_TINT]) {
      expect(meetsNonText(contrastRatio("#F5F1F2", surface))).toBe(true);
    }
  });
});

describe("prefers-contrast: more reaches AAA", () => {
  it("lifts the two AA-only tokens over 7:1", () => {
    expect(contrastRatio("#B0A7AA", BG)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio("#FF7A7A", BG)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio("#FF7A7A", BG)).toBeCloseTo(7.82, 1);
  });
});
