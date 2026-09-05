/**
 * WCAG 2.x relative luminance and contrast ratio.
 *
 * This exists so the palette in src/styles/tokens.css can be ASSERTED rather
 * than asserted-about. On an accessibility specialist's own portfolio a failing
 * contrast test is a better artefact than a passing claim -- and it means a
 * future palette tweak cannot silently regress.
 */

export type Rgb = { r: number; g: number; b: number };

export const parseHex = (hex: string): Rgb => {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Not a hex colour: ${hex}`);
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
};

const channel = (value: number): number => {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = (hex: string): number => {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

export type Grade = "AAA" | "AA" | "FAIL";

/** Large text is >=18.66px bold or >=24px regular. */
export const grade = (ratio: number, large = false): Grade => {
  const [aaa, aa] = large ? [4.5, 3] : [7, 4.5];
  if (ratio >= aaa) return "AAA";
  if (ratio >= aa) return "AA";
  return "FAIL";
};

/** SC 1.4.11: non-text contrast (borders, control boundaries, focus rings). */
export const meetsNonText = (ratio: number): boolean => ratio >= 3;
