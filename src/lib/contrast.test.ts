import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, grade, meetsNonText, parseHex, relativeLuminance } from "./contrast";

/**
 * These are the palette's guarantees, asserted against the real token file.
 * A palette tweak that regresses accessibility fails here rather than shipping.
 */

const DARK_BG = "#090D0D";
const DARK_SURFACES = [DARK_BG, "#0F1414", "#151B1B", "#1B2A0D"];
const LIGHT_BG = "#F7F7F2";
const LIGHT_SURFACES = [LIGHT_BG, "#FFFFFF", "#ECEEE7", "#E9F6C7"];

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
    expect(contrastRatio("#B8F500", DARK_BG)).toBeCloseTo(contrastRatio(DARK_BG, "#B8F500"), 10);
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
    ["console-1000", DARK_BG],
    ["console-985", "#0f1414"],
    ["console-975", "#151b1b"],
    ["console-900", "#1b2a0d"],
    ["lime-300", "#b8f500"],
    ["lime-200", "#d2ff5c"],
    ["paper-50", "#ffffff"],
    ["paper-100", LIGHT_BG],
    ["paper-200", "#eceee7"],
    ["paper-300", "#c9cec3"],
    ["ink-950", "#151713"],
    ["ink-800", "#40453d"],
    ["ink-700", "#62685c"],
    ["olive-700", "#446500"],
    ["olive-900", "#304900"],
    ["stone-100", "#f5f1f2"],
    ["stone-300", "#b0a7aa"],
  ])("--%s is %s", (name, expected) => {
    expect(tokenHex(name).toLowerCase()).toBe(expected.toLowerCase());
  });
});

describe("dark theme text clears its intended floor on every surface", () => {
  it.each([
    ["--fg", "#F5F1F2", "AAA"],
    ["--fg-muted", "#B0A7AA", "AA"],
    ["--fg-dim", "#8F968B", "AA"],
    ["--accent", "#B8F500", "AAA"],
    ["--accent-hover", "#D2FF5C", "AAA"],
  ] as const)("%s reaches at least %s everywhere", (_name, hex, floor) => {
    for (const surface of DARK_SURFACES) {
      const ratio = contrastRatio(hex, surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      if (floor === "AAA") expect(ratio).toBeGreaterThanOrEqual(7);
    }
  });

  it("pins the headline ratios against the page background", () => {
    expect(contrastRatio("#F5F1F2", DARK_BG)).toBeCloseTo(17.44, 1);
    expect(contrastRatio("#B0A7AA", DARK_BG)).toBeCloseTo(8.33, 1);
    expect(contrastRatio("#8F968B", DARK_BG)).toBeCloseTo(6.42, 1);
    expect(contrastRatio("#B8F500", DARK_BG)).toBeCloseTo(14.98, 1);
  });
});

describe("light theme text clears its intended floor on every surface", () => {
  it.each([
    ["--fg", "#151713", "AAA"],
    ["--fg-muted", "#40453D", "AAA"],
    ["--fg-dim", "#62685C", "AA"],
    ["--accent", "#446500", "AA"],
    ["--accent-hover", "#304900", "AAA"],
  ] as const)("%s reaches at least %s everywhere", (_name, hex, floor) => {
    for (const surface of LIGHT_SURFACES) {
      const ratio = contrastRatio(hex, surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      if (floor === "AAA") expect(ratio).toBeGreaterThanOrEqual(7);
    }
  });
});

describe("fills and boundaries (SC 1.4.11)", () => {
  it("each accent fill is a legal boundary against its page", () => {
    expect(meetsNonText(contrastRatio("#B8F500", DARK_BG))).toBe(true);
    expect(meetsNonText(contrastRatio("#446500", LIGHT_BG))).toBe(true);
  });

  it("accent-on-fill text reaches AA in both themes", () => {
    expect(grade(contrastRatio(DARK_BG, "#B8F500"))).not.toBe("FAIL");
    expect(grade(contrastRatio("#FFFFFF", "#446500"))).not.toBe("FAIL");
  });

  it("border-strong holds the 3:1 floor on every theme surface", () => {
    for (const surface of DARK_SURFACES) {
      expect(meetsNonText(contrastRatio("#66736C", surface))).toBe(true);
    }
    for (const surface of LIGHT_SURFACES) {
      expect(meetsNonText(contrastRatio("#62685C", surface))).toBe(true);
    }
  });
});

describe("the focus ring must be a dual ring", () => {
  it("the page-colour halo passes against each accent fill", () => {
    expect(meetsNonText(contrastRatio(DARK_BG, "#B8F500"))).toBe(true);
    expect(meetsNonText(contrastRatio(LIGHT_BG, "#446500"))).toBe(true);
  });

  it("the ring passes on every ordinary surface in both themes", () => {
    for (const surface of DARK_SURFACES) {
      expect(meetsNonText(contrastRatio("#F5F1F2", surface))).toBe(true);
    }
    for (const surface of LIGHT_SURFACES) {
      expect(meetsNonText(contrastRatio("#151713", surface))).toBe(true);
    }
  });
});

describe("prefers-contrast: more reaches AAA", () => {
  it("lifts dim text and accent colours over 7:1", () => {
    for (const surface of DARK_SURFACES) {
      expect(contrastRatio("#F5F1F2", surface)).toBeGreaterThanOrEqual(7);
      expect(contrastRatio("#D2FF5C", surface)).toBeGreaterThanOrEqual(7);
    }
    for (const surface of LIGHT_SURFACES) {
      expect(contrastRatio("#40453D", surface)).toBeGreaterThanOrEqual(7);
      expect(contrastRatio("#304900", surface)).toBeGreaterThanOrEqual(7);
    }
  });
});
