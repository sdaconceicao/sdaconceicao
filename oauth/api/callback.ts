import {
  buildErrorMessage,
  buildSuccessMessage,
  constantTimeEqual,
  OAUTH_CALLBACK_URL,
  OAUTH_COOKIE_PATH,
  OAUTH_PROVIDER,
  OAUTH_STATE_COOKIE,
  PUBLIC_SITE_ORIGIN,
  readCookie,
  renderHandshakeHtml,
} from "../lib/oauth";

const htmlResponse = (body: string, secure: boolean): Response =>
  new Response(body, {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "content-security-policy":
        "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      "content-type": "text/html; charset=utf-8",
      "referrer-policy": "no-referrer",
      "set-cookie": `${OAUTH_STATE_COOKIE}=; HttpOnly${secure ? "; Secure" : ""}; SameSite=Lax; Path=${OAUTH_COOKIE_PATH}; Max-Age=0`,
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "x-robots-tag": "noindex, nofollow",
    },
  });

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const respond = (message: string) => htmlResponse(message, url.protocol === "https:");
  const fail = (reason: string) =>
    respond(renderHandshakeHtml(buildErrorMessage(OAUTH_PROVIDER, reason), PUBLIC_SITE_ORIGIN));

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("OAuth is not configured on this deployment.");

  const oauthError = url.searchParams.get("error");
  if (oauthError) return fail(url.searchParams.get("error_description") ?? oauthError);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = readCookie(request.headers.get("cookie"), OAUTH_STATE_COOKIE);
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
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: OAUTH_CALLBACK_URL,
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

  return respond(
    renderHandshakeHtml(
      buildSuccessMessage(OAUTH_PROVIDER, payload.access_token),
      PUBLIC_SITE_ORIGIN,
    ),
  );
}
