import { GITHUB_OAUTH_CLIENT_ID } from "astro:env/server";
import type { APIRoute } from "astro";
import {
  buildAuthorizeUrl,
  OAUTH_COOKIE_PATH,
  OAUTH_PROVIDER,
  OAUTH_STATE_COOKIE,
} from "../../lib/oauth";

export const prerender = false;

export const GET: APIRoute = ({ url, site, cookies, redirect }) => {
  const origin = site?.origin ?? url.origin;

  if (url.searchParams.get("provider") !== OAUTH_PROVIDER) {
    return new Response("Unsupported provider", { status: 400 });
  }
  if (!GITHUB_OAUTH_CLIENT_ID) {
    return new Response("GITHUB_OAUTH_CLIENT_ID is not configured.", { status: 500 });
  }

  const state = crypto.randomUUID().replace(/-/g, "");

  // SameSite=Lax survives GitHub's cross-site top-level GET redirect back to
  // /api/callback. Strict would drop the cookie and EVERY login would fail.
  cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    path: OAUTH_COOKIE_PATH,
    maxAge: 600,
  });

  return redirect(
    buildAuthorizeUrl({
      clientId: GITHUB_OAUTH_CLIENT_ID,
      redirectUri: new URL("/api/callback", origin).toString(),
      scope: url.searchParams.get("scope") ?? "public_repo",
      state,
    }),
    302,
  );
};
