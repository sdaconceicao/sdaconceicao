import { describe, expect, it } from "vitest";
import {
  formatLongDate,
  formatMonthYear,
  formatPeriod,
  readingTimeMinutes,
  toISODate,
  yearsSince,
} from "./dates";

const d = (iso: string) => new Date(iso);

describe("formatMonthYear", () => {
  it("renders a short month and full year", () => {
    expect(formatMonthYear(d("2019-03-01T00:00:00Z"))).toBe("Mar 2019");
  });

  it("is stable at a UTC month boundary regardless of local zone", () => {
    expect(formatMonthYear(d("2022-01-01T00:00:00Z"))).toBe("Jan 2022");
    expect(formatMonthYear(d("2021-12-31T23:59:59Z"))).toBe("Dec 2021");
  });
});

describe("formatLongDate", () => {
  it("renders a full date", () => {
    expect(formatLongDate(d("2019-03-14T00:00:00Z"))).toBe("March 14, 2019");
  });
});

describe("toISODate", () => {
  it("emits a date-only ISO string for a datetime attribute", () => {
    expect(toISODate(d("2019-03-14T12:34:56Z"))).toBe("2019-03-14");
  });
});

describe("formatPeriod", () => {
  it("uses Present for a current role", () => {
    expect(formatPeriod(d("2022-01-01T00:00:00Z"), undefined, true)).toBe("Jan 2022 — Present");
  });

  it("renders a closed range", () => {
    expect(formatPeriod(d("2019-03-01T00:00:00Z"), d("2021-06-01T00:00:00Z"), false)).toBe(
      "Mar 2019 — Jun 2021",
    );
  });

  it("lets current win over a stale dateEnd so they cannot contradict", () => {
    expect(formatPeriod(d("2019-03-01T00:00:00Z"), d("2021-06-01T00:00:00Z"), true)).toBe(
      "Mar 2019 — Present",
    );
  });

  it("falls back to Present when neither dateEnd nor current is given", () => {
    expect(formatPeriod(d("2019-03-01T00:00:00Z"), undefined, false)).toBe("Mar 2019 — Present");
  });
});

describe("yearsSince", () => {
  it("counts whole years", () => {
    expect(yearsSince(d("2010-01-01T00:00:00Z"), d("2026-01-01T00:00:00Z"))).toBe(16);
  });

  it("does not round up before the anniversary month", () => {
    expect(yearsSince(d("2010-06-01T00:00:00Z"), d("2026-05-31T00:00:00Z"))).toBe(15);
  });

  it("does not round up earlier in the anniversary month", () => {
    expect(yearsSince(d("2010-06-15T00:00:00Z"), d("2026-06-14T00:00:00Z"))).toBe(15);
  });

  it("counts the anniversary day itself", () => {
    expect(yearsSince(d("2010-06-15T00:00:00Z"), d("2026-06-15T00:00:00Z"))).toBe(16);
  });

  it("never goes negative for a future start date", () => {
    expect(yearsSince(d("2030-01-01T00:00:00Z"), d("2026-01-01T00:00:00Z"))).toBe(0);
  });
});

describe("readingTimeMinutes", () => {
  it("is zero for empty input", () => {
    expect(readingTimeMinutes("")).toBe(0);
    expect(readingTimeMinutes("   \n  ")).toBe(0);
  });

  it("floors at one minute for very short posts", () => {
    expect(readingTimeMinutes("one two three")).toBe(1);
  });

  it("scales at roughly 200 words per minute", () => {
    expect(readingTimeMinutes(Array(400).fill("word").join(" "))).toBe(2);
  });

  it("honours an explicit rate", () => {
    expect(readingTimeMinutes(Array(100).fill("word").join(" "), 100)).toBe(1);
  });

  it("collapses irregular whitespace when counting", () => {
    expect(readingTimeMinutes("a  b\n\nc\td")).toBe(1);
  });
});
