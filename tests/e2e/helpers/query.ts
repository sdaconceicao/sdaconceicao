const WORD = /[\p{L}\p{N}]{3,}/gu;

export const parseJsonStringArray = (value: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
};

export const parseProjectStatus = (value: string | null): "live" | "wip" | "archived" =>
  value === "archived" || value === "wip" ? value : "live";

export const wordsIn = (text: string): string[] => [
  ...new Set(text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().match(WORD) ?? []),
];

export const findUniqueQuery = <T>(
  items: readonly T[],
  textOf: (item: T) => string,
  matches: (item: T, query: string) => boolean,
): { query: string; item: T } | undefined => {
  for (const item of items) {
    for (const word of wordsIn(textOf(item))) {
      const hits = items.filter((candidate) => matches(candidate, word));
      if (hits.length === 1 && hits[0] === item) {
        return { query: word, item };
      }
    }
  }
};

export const findNarrowingQuery = <T>(
  items: readonly T[],
  textOf: (item: T) => string,
  matches: (item: T, query: string) => boolean,
): { query: string; remaining: T[] } | undefined => {
  if (items.length < 2) return undefined;
  for (const item of items) {
    for (const word of wordsIn(textOf(item))) {
      const remaining = items.filter((candidate) => matches(candidate, word));
      if (remaining.length > 0 && remaining.length < items.length) {
        return { query: word, remaining };
      }
    }
  }
};

export const findUniquePrefix = (
  options: readonly string[],
  minLength = 3,
): { option: string; prefix: string } | undefined => {
  for (const option of options) {
    const max = Math.min(5, option.length);
    for (let length = max; length >= minLength; length -= 1) {
      const prefix = option.slice(0, length);
      const hits = options.filter((candidate) =>
        candidate.toLocaleLowerCase().includes(prefix.toLocaleLowerCase()),
      );
      if (hits.length === 1) return { option, prefix };
    }
  }
};
