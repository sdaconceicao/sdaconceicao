import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../../../oauth/api/auth";

afterEach(() => vi.unstubAllEnvs());

describe("GET /api/auth", () => {
  it("rejects unsupported providers", () => {
    const response = GET(new Request("https://auth.stephenandrewdesigns.com/api/auth"));

    expect(response.status).toBe(400);
  });

  it("fails clearly when the client ID is missing", async () => {
    vi.stubEnv("GITHUB_OAUTH_CLIENT_ID", "");

    const response = GET(
      new Request("https://auth.stephenandrewdesigns.com/api/auth?provider=github"),
    );

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toContain("GITHUB_OAUTH_CLIENT_ID");
  });

  it("redirects to GitHub with the fixed callback, least-privilege scope, and state cookie", () => {
    vi.stubEnv("GITHUB_OAUTH_CLIENT_ID", "client-id");

    const response = GET(
      new Request("https://auth.stephenandrewdesigns.com/api/auth?provider=github&scope=repo"),
    );
    const location = new URL(response.headers.get("location") ?? "");

    expect(response.status).toBe(302);
    expect(location.origin + location.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(location.searchParams.get("redirect_uri")).toBe(
      "https://auth.stephenandrewdesigns.com/api/callback",
    );
    expect(location.searchParams.get("scope")).toBe("public_repo");
    expect(location.searchParams.get("state")).toMatch(/^[a-f0-9]{32}$/);
    expect(response.headers.get("set-cookie")).toMatch(
      /^decap_oauth_state=[a-f0-9]{32}; HttpOnly; Secure; SameSite=Lax; Path=\/api; Max-Age=600$/,
    );
  });
});
