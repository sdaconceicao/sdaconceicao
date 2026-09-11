import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./callback";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/callback", () => {
  it("fails clearly and clears state when OAuth is not configured", async () => {
    vi.stubEnv("GITHUB_OAUTH_CLIENT_ID", "");
    vi.stubEnv("GITHUB_OAUTH_CLIENT_SECRET", "");

    const response = await GET(new Request("https://auth.stephenandrewdesigns.com/api/callback"));

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain("OAuth is not configured");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("exchanges a valid code and returns Decap's success handshake", async () => {
    vi.stubEnv("GITHUB_OAUTH_CLIENT_ID", "client-id");
    vi.stubEnv("GITHUB_OAUTH_CLIENT_SECRET", "client-secret");
    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        client_id: "client-id",
        client_secret: "client-secret",
        code: "github-code",
        redirect_uri: "https://auth.stephenandrewdesigns.com/api/callback",
      });
      return Response.json({ access_token: "github-token" });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request(
        "https://auth.stephenandrewdesigns.com/api/callback?code=github-code&state=state-value",
        { headers: { cookie: "decap_oauth_state=state-value" } },
      ),
    );
    const body = await response.text();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(body).toContain('authorization:github:success:{\\"token\\":\\"github-token\\"');
    expect(body).toContain('var allowedOrigin = "https://stephenandrewdesigns.com"');
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
  });
});
