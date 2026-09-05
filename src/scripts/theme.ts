export type Theme = "light" | "dark";

export const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark";

export const preferredTheme = (stored: string | null, prefersDark: boolean): Theme =>
  isTheme(stored) ? stored : prefersDark ? "dark" : "light";

export const nextTheme = (current: string | null): Theme => (current === "dark" ? "light" : "dark");

export const themeToggleLabel = (current: Theme): string => `Switch to ${nextTheme(current)} theme`;
