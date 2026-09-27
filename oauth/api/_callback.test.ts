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

  const configured = () => {
    vi.stubEnv("GITHUB_OAUTH_CLIENT_ID", "client-id");
    vi.stubEnv("GITHUB_OAUTH_CLIENT_SECRET", "client-secret");
  };

  const callback = (search: string, cookie?: string) =>
    GET(
      new Request(`https://auth.stephenandrewdesigns.com/api/callback${search}`, {
        headers: cookie ? { cookie } : {},
      }),
    );

  it("surfaces GitHub's authorize error instead of exchanging a code", async () => {
    configured();

    const response = await callback("?error=access_denied&error_description=User+denied");
    const body = await response.text();

    expect(body).toContain("authorization:github:error:");
    expect(body).toContain("User denied");

    const bare = await callback("?error=access_denied");
    await expect(bare.text()).resolves.toContain("access_denied");
  });

  it("fails when GitHub omits the authorization code", async () => {
    configured();

    const response = await callback("?state=state-value", "decap_oauth_state=state-value");
    const body = await response.text();

    expect(body).toContain("GitHub did not return an authorization code.");
  });

  it("fails on a missing or mismatched state cookie", async () => {
    configured();

    const missing = await callback("?code=github-code&state=state-value");
    await expect(missing.text()).resolves.toContain("OAuth state mismatch");

    const mismatched = await callback(
      "?code=github-code&state=state-value",
      "decap_oauth_state=other-value",
    );
    await expect(mismatched.text()).resolves.toContain("OAuth state mismatch");
  });

  it("fails when the token exchange is rejected or unreachable", async () => {
    configured();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 502 })),
    );

    const rejected = await callback(
      "?code=github-code&state=state-value",
      "decap_oauth_state=state-value",
    );
    await expect(rejected.text()).resolves.toContain("GitHub token exchange failed (502)");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    const offline = await callback(
      "?code=github-code&state=state-value",
      "decap_oauth_state=state-value",
    );
    await expect(offline.text()).resolves.toContain("Could not reach GitHub");
  });

  it("fails when GitHub returns no access token", async () => {
    configured();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "bad_verification_code" })),
    );

    const response = await callback(
      "?code=github-code&state=state-value",
      "decap_oauth_state=state-value",
    );
    await expect(response.text()).resolves.toContain("bad_verification_code");
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
