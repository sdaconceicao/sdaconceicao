import { describe, expect, it } from "vitest";
import { isTheme, nextTheme, preferredTheme, themeToggleLabel } from "./theme";

describe("theme preferences", () => {
  it("recognises only supported theme names", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it("uses a saved preference before the system preference", () => {
    expect(preferredTheme("light", true)).toBe("light");
    expect(preferredTheme("dark", false)).toBe("dark");
  });

  it("falls back to the system preference", () => {
    expect(preferredTheme(null, true)).toBe("dark");
    expect(preferredTheme("invalid", false)).toBe("light");
  });

  it("switches between the themes", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
    expect(nextTheme(null)).toBe("dark");
  });

  it("describes the action rather than the current state", () => {
    expect(themeToggleLabel("light")).toBe("Switch to dark theme");
    expect(themeToggleLabel("dark")).toBe("Switch to light theme");
  });
});
