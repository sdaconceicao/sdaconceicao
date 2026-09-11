import {
  buildAuthorizeUrl,
  OAUTH_CALLBACK_URL,
  OAUTH_COOKIE_PATH,
  OAUTH_PROVIDER,
  OAUTH_STATE_COOKIE,
} from "../lib/oauth.js";

const noStoreHeaders = {
  "cache-control": "no-store",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

export function GET(request: Request): Response {
  const url = new URL(request.url);

  if (url.searchParams.get("provider") !== OAUTH_PROVIDER) {
    return new Response("Unsupported provider", { status: 400, headers: noStoreHeaders });
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return new Response("GITHUB_OAUTH_CLIENT_ID is not configured.", {
      status: 500,
      headers: noStoreHeaders,
    });
  }

  const state = crypto.randomUUID().replace(/-/g, "");
  const secure = url.protocol === "https:" ? "; Secure" : "";
  const authorizationUrl = buildAuthorizeUrl({
    clientId,
    redirectUri: OAUTH_CALLBACK_URL,
    scope: "public_repo",
    state,
  });

  return new Response(null, {
    status: 302,
    headers: {
      ...noStoreHeaders,
      location: authorizationUrl,
      "set-cookie": `${OAUTH_STATE_COOKIE}=${state}; HttpOnly${secure}; SameSite=Lax; Path=${OAUTH_COOKIE_PATH}; Max-Age=600`,
    },
  });
}
