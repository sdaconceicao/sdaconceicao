import { describe, expect, it } from "vitest";
import {
  findNarrowingQuery,
  findUniquePrefix,
  findUniqueQuery,
  parseJsonStringArray,
  parseProjectStatus,
  wordsIn,
} from "./query";

describe("wordsIn", () => {
  it("dedupes, lowercases, and strips accents", () => {
    expect(wordsIn("Poképendium Patterns pokependium")).toEqual(["pokependium", "patterns"]);
  });

  it("ignores words shorter than three characters", () => {
    expect(wordsIn("a an to CSS")).toEqual(["css"]);
  });

  it("is empty for blank input", () => {
    expect(wordsIn("   ")).toEqual([]);
  });
});

describe("parseJsonStringArray", () => {
  it("reads a JSON string array", () => {
    expect(parseJsonStringArray('["React","CSS"]')).toEqual(["React", "CSS"]);
  });

  it("is empty for missing, invalid, or non-string JSON", () => {
    expect(parseJsonStringArray(null)).toEqual([]);
    expect(parseJsonStringArray("")).toEqual([]);
    expect(parseJsonStringArray("not-json")).toEqual([]);
    expect(parseJsonStringArray("[1,2]")).toEqual([]);
    expect(parseJsonStringArray('{"tag":"React"}')).toEqual([]);
  });
});

describe("parseProjectStatus", () => {
  it("keeps known statuses and defaults anything else to live", () => {
    expect(parseProjectStatus("archived")).toBe("archived");
    expect(parseProjectStatus("wip")).toBe("wip");
    expect(parseProjectStatus("live")).toBe("live");
    expect(parseProjectStatus(null)).toBe("live");
    expect(parseProjectStatus("unknown")).toBe("live");
  });
});

describe("findUniqueQuery", () => {
  const items = [
    { id: "a", text: "Local Storage Options" },
    { id: "b", text: "Using Agents Effectively" },
  ];
  const matches = (item: (typeof items)[number], query: string) =>
    item.text.toLowerCase().includes(query);

  it("returns a word that matches exactly one item", () => {
    expect(findUniqueQuery(items, (item) => item.text, matches)).toEqual({
      query: "local",
      item: items[0],
    });
  });

  it("is undefined when every word is shared", () => {
    const shared = [
      { id: "a", text: "Agent guide" },
      { id: "b", text: "Agent guide" },
    ];
    expect(findUniqueQuery(shared, (item) => item.text, matches)).toBeUndefined();
  });
});

describe("findNarrowingQuery", () => {
  const items = [
    { id: "a", text: "Agents and storage" },
    { id: "b", text: "Agents and review" },
    { id: "c", text: "Design systems" },
  ];
  const matches = (item: (typeof items)[number], query: string) =>
    item.text.toLowerCase().includes(query);

  it("returns a word that keeps a proper subset", () => {
    const found = findNarrowingQuery(items, (item) => item.text, matches);
    expect(found).toBeDefined();
    expect(found?.remaining.length).toBeGreaterThan(0);
    expect(found?.remaining.length).toBeLessThan(items.length);
  });

  it("is undefined for a single item or an empty list", () => {
    expect(findNarrowingQuery(items.slice(0, 1), (item) => item.text, matches)).toBeUndefined();
    expect(findNarrowingQuery([], (item) => item.text, matches)).toBeUndefined();
  });
});

describe("findUniquePrefix", () => {
  it("returns the longest prefix that matches one option", () => {
    expect(findUniquePrefix(["GraphQl", "React", "TypeScript"])).toEqual({
      option: "GraphQl",
      prefix: "Graph",
    });
  });

  it("is undefined when every prefix collides", () => {
    expect(findUniquePrefix(["React", "Reactive"])).toBeUndefined();
  });

  it("is undefined for empty input or options shorter than the minimum prefix", () => {
    expect(findUniquePrefix([])).toBeUndefined();
    expect(findUniquePrefix(["Go", "Qi"])).toBeUndefined();
  });
});
