import { GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET } from "astro:env/server";
import type { APIRoute } from "astro";
import {
  buildErrorMessage,
  buildSuccessMessage,
  constantTimeEqual,
  OAUTH_COOKIE_PATH,
  OAUTH_PROVIDER,
  OAUTH_STATE_COOKIE,
  renderHandshakeHtml,
} from "../../lib/oauth";

export const prerender = false;

const htmlResponse = (body: string): Response =>
  new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-robots-tag": "noindex, nofollow",
    },
  });

export const GET: APIRoute = async ({ url, site, cookies }) => {
  const origin = site?.origin ?? url.origin;
  const fail = (reason: string) =>
    htmlResponse(renderHandshakeHtml(buildErrorMessage(OAUTH_PROVIDER, reason), origin));

  const expectedState = cookies.get(OAUTH_STATE_COOKIE)?.value;
  cookies.delete(OAUTH_STATE_COOKIE, { path: OAUTH_COOKIE_PATH });

  if (!GITHUB_OAUTH_CLIENT_ID || !GITHUB_OAUTH_CLIENT_SECRET) {
    return fail("OAuth is not configured on this deployment.");
  }

  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return fail(url.searchParams.get("error_description") ?? oauthError);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code) return fail("GitHub did not return an authorization code.");
  if (!state || !expectedState || !constantTimeEqual(state, expectedState)) {
    return fail("OAuth state mismatch. Start again from /admin/.");
  }

  let payload: { access_token?: string; error?: string; error_description?: string };
  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "user-agent": "stephenandrewdesigns-decap-oauth",
      },
      body: JSON.stringify({
        client_id: GITHUB_OAUTH_CLIENT_ID,
        client_secret: GITHUB_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: new URL("/api/callback", origin).toString(),
      }),
    });
    if (!response.ok) return fail(`GitHub token exchange failed (${response.status}).`);
    payload = await response.json();
  } catch {
    return fail("Could not reach GitHub to exchange the authorization code.");
  }

  if (!payload.access_token) {
    return fail(payload.error_description ?? payload.error ?? "GitHub returned no access token.");
  }

  return htmlResponse(
    renderHandshakeHtml(buildSuccessMessage(OAUTH_PROVIDER, payload.access_token), origin),
  );
};
