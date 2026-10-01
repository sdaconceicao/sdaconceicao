import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type Activity,
  calendarLayout,
  fetchActivity,
  initGitHubActivity,
  parseActivity,
} from "./GitHubActivity";

afterEach(() => vi.unstubAllGlobals());

const levels = [
  "NONE",
  "FIRST_QUARTILE",
  "SECOND_QUARTILE",
  "THIRD_QUARTILE",
  "FOURTH_QUARTILE",
] as const;

function activityFrom(from: string, to: string): Activity {
  const start = Date.parse(`${from}T00:00:00Z`);
  const length = (Date.parse(`${to}T00:00:00Z`) - start) / 86_400_000 + 1;
  return {
    from,
    to,
    total: 1234,
    days: Array.from({ length }, (_, index) => ({
      date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
      contributionCount: index % 5,
      contributionLevel: levels[index % 5],
    })),
  };
}

const activity = activityFrom("2026-07-01", "2026-08-02");

describe("GitHub activity data", () => {
  it("fetches a valid calendar", async () => {
    const request = vi.fn(async () => Response.json(activity)) as unknown as typeof fetch;
    await expect(fetchActivity("/api/activity", request)).resolves.toEqual(activity);
    expect(request).toHaveBeenCalledWith("/api/activity");
  });

  it("rejects HTTP, network, and invalid JSON responses", async () => {
    const httpError = vi.fn(
      async () => new Response(null, { status: 502 }),
    ) as unknown as typeof fetch;
    await expect(fetchActivity("/api/activity", httpError)).rejects.toThrow(
      "Activity request failed (502)",
    );

    const networkError = vi.fn(async () => {
      throw new TypeError("Network unavailable");
    }) as unknown as typeof fetch;
    await expect(fetchActivity("/api/activity", networkError)).rejects.toThrow(
      "Network unavailable",
    );

    const invalidJson = vi.fn(
      async () => new Response("{", { status: 200 }),
    ) as unknown as typeof fetch;
    await expect(fetchActivity("/api/activity", invalidJson)).rejects.toThrow(SyntaxError);
  });

  it.each([
    ["empty calendar", { ...activity, days: [] }, "Empty activity"],
    ["missing calendar", null, "Invalid activity calendar"],
    ["invalid range start", { ...activity, from: "2026-02-30" }, "Invalid activity calendar"],
    ["mismatched range end", { ...activity, to: "2026-08-03" }, "Invalid activity calendar"],
    ["missing total", { ...activity, total: undefined }, "Invalid activity calendar"],
    ["negative total", { ...activity, total: -1 }, "Invalid activity calendar"],
    ["missing day", { ...activity, days: [null] }, "Invalid activity calendar"],
    [
      "skipped date",
      {
        ...activity,
        days: activity.days.map((day, index) =>
          index === 1 ? { ...day, date: "2026-07-04" } : day,
        ),
      },
      "Invalid activity calendar",
    ],
    [
      "negative count",
      {
        ...activity,
        days: activity.days.map((day, index) =>
          index === 0 ? { ...day, contributionCount: -1 } : day,
        ),
      },
      "Invalid activity calendar",
    ],
    [
      "unknown level",
      {
        ...activity,
        days: activity.days.map((day, index) =>
          index === 0 ? { ...day, contributionLevel: "VERY_HIGH" } : day,
        ),
      },
      "Invalid activity calendar",
    ],
  ])("rejects %s", (_name, payload, message) => {
    expect(() => parseActivity(payload)).toThrow(message);
  });

  it.each([
    {
      from: "2026-01-01",
      to: "2026-03-31",
      days: 90,
      viewBox: "0 0 220 118",
      months: [
        { x: 24, label: "Jan" },
        { x: 94, label: "Feb" },
        { x: 150, label: "Mar" },
      ],
      samples: [
        ["2026-01-01", 24, 72],
        ["2026-01-04", 38, 16],
        ["2026-02-01", 94, 16],
        ["2026-03-01", 150, 16],
        ["2026-03-31", 206, 44],
      ],
    },
    {
      from: "2025-11-01",
      to: "2026-01-31",
      days: 92,
      viewBox: "0 0 220 118",
      months: [
        { x: 24, label: "Nov" },
        { x: 94, label: "Dec" },
        { x: 150, label: "Jan" },
      ],
      samples: [
        ["2025-11-01", 24, 100],
        ["2025-11-02", 38, 16],
        ["2025-12-01", 94, 30],
        ["2026-01-01", 150, 72],
        ["2026-01-31", 206, 100],
      ],
    },
    {
      from: "2028-02-01",
      to: "2028-04-30",
      days: 90,
      viewBox: "0 0 220 118",
      months: [
        { x: 24, label: "Feb" },
        { x: 80, label: "Mar" },
        { x: 136, label: "Apr" },
      ],
      samples: [
        ["2028-02-01", 24, 44],
        ["2028-02-29", 80, 44],
        ["2028-03-01", 80, 58],
        ["2028-04-01", 136, 100],
        ["2028-04-30", 206, 16],
      ],
    },
  ])(
    "places every date box from $from through $to",
    ({ from, to, days, viewBox, months, samples }) => {
      const activity = activityFrom(from, to);
      const layout = calendarLayout(activity);

      expect(layout.viewBox).toBe(viewBox);
      expect(layout.months).toEqual(months);
      expect(layout.cells).toHaveLength(days);
      expect(new Set(layout.cells.map((cell) => `${cell.x}:${cell.y}`)).size).toBe(days);

      for (const [date, x, y] of samples) {
        const index = activity.days.findIndex((day) => day.date === date);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(layout.cells[index]).toMatchObject({
          x,
          y,
          tooltip: expect.stringContaining(date as string),
        });
      }
    },
  );

  it("maps all contribution levels and formats accessible summaries", () => {
    const layout = calendarLayout(activity);

    expect(layout.cells.slice(0, 5).map((cell) => cell.level)).toEqual([0, 1, 2, 3, 4]);
    expect(layout.cells[0].tooltip).toBe("0 contributions on 2026-07-01");
    expect(layout.cells[1].tooltip).toBe("1 contribution on 2026-07-02");
    expect(layout.period).toBe("Jul – Aug 2026");
    expect(layout.total).toBe("1,234 contributions");
    expect(layout.accessibleName).toBe("1234 GitHub contributions from July 1 to August 2, 2026");
  });
});

describe("GitHub activity browser behavior", () => {
  it("binds once, waits for desktop, and allows retry after an error", async () => {
    const status = { textContent: "Loading activity…" };
    const root = {
      dataset: {} as Record<string, string>,
      querySelector: vi.fn(() => status),
    };
    const listeners: Array<() => Promise<void>> = [];
    const desktop = {
      matches: false,
      addEventListener: vi.fn((_event: string, listener: () => Promise<void>) => {
        listeners.push(listener);
      }),
    };
    const request = vi.fn(async () => new Response(null, { status: 503 }));
    vi.stubGlobal("document", { querySelector: vi.fn(() => root) });
    vi.stubGlobal("window", { matchMedia: vi.fn(() => desktop) });
    vi.stubGlobal("fetch", request);

    initGitHubActivity();
    initGitHubActivity();
    expect(root.dataset.bound).toBe("true");
    expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 64rem)");
    expect(desktop.addEventListener).toHaveBeenCalledTimes(1);
    expect(request).not.toHaveBeenCalled();

    desktop.matches = true;
    await listeners[0]();
    expect(request).toHaveBeenCalledTimes(1);
    expect(root.dataset.loaded).toBe("false");
    expect(status.textContent).toBe("Activity is unavailable right now.");

    await listeners[0]();
    expect(request).toHaveBeenCalledTimes(2);
  });
});
