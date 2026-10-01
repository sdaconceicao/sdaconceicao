import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./activity";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("GET /api/activity", () => {
  it("requires a server-side GitHub token", async () => {
    vi.stubEnv("GITHUB_ACTIVITY_TOKEN", "");
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("returns the live three-month calendar without exposing the token", async () => {
    vi.stubEnv("GITHUB_ACTIVITY_TOKEN", "private-token");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-30T15:00:00Z"));
    const githubFetch = vi.fn().mockResolvedValue(
      Response.json({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: 3,
                weeks: [
                  {
                    contributionDays: [
                      {
                        date: "2026-07-01",
                        contributionCount: 1,
                        contributionLevel: "FIRST_QUARTILE",
                      },
                    ],
                  },
                  {
                    contributionDays: [
                      {
                        date: "2026-07-02",
                        contributionCount: 2,
                        contributionLevel: "SECOND_QUARTILE",
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      }),
    );
    vi.stubGlobal("fetch", githubFetch);

    const response = await GET();
    const [, options] = githubFetch.mock.calls[0];
    expect(githubFetch.mock.calls[0][0]).toBe("https://api.github.com/graphql");
    expect(options.headers.authorization).toBe("Bearer private-token");
    expect(JSON.parse(options.body).variables).toEqual({
      login: "sdaconceicao",
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-09-30T15:00:00.000Z",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("vercel-cdn-cache-control")).toContain("max-age=1800");
    expect(await response.json()).toEqual({
      from: "2026-07-01",
      to: "2026-09-30",
      total: 3,
      days: [
        { date: "2026-07-01", contributionCount: 1, contributionLevel: "FIRST_QUARTILE" },
        { date: "2026-07-02", contributionCount: 2, contributionLevel: "SECOND_QUARTILE" },
      ],
    });
  });

  it.each([
    ["HTTP error", () => new Response("Unauthorized", { status: 401 })],
    ["GraphQL error", () => Response.json({ errors: [{ message: "Bad credentials" }] })],
    ["missing calendar", () => Response.json({ data: { user: null } })],
    ["invalid JSON", () => new Response("{", { status: 200 })],
  ])("returns an uncached error for a GitHub %s", async (_case, upstreamResponse) => {
    vi.stubEnv("GITHUB_ACTIVITY_TOKEN", "private-token");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(upstreamResponse()));
    const response = await GET();
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("returns an uncached error when GitHub is unreachable", async () => {
    vi.stubEnv("GITHUB_ACTIVITY_TOKEN", "private-token");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Network unavailable")));
    const response = await GET();
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
