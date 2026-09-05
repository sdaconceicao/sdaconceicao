/**
 * String building for the Decap CMS GitHub OAuth handshake.
 *
 * Every function here is pure so the exact wire format can be pinned by tests.
 * That matters more than usual: Decap matches these strings with a regex and an
 * `===` origin compare, and a mismatch produces no console error and no failed
 * request -- the login popup simply hangs forever. See oauth.test.ts.
 */

export const OAUTH_PROVIDER = "github" as const;
export const OAUTH_STATE_COOKIE = "decap_oauth_state";
export const OAUTH_COOKIE_PATH = "/api";

/** The readiness ping the popup sends, and the echo it waits for. */
export const OAUTH_HANDSHAKE_MESSAGE = `authorizing:${OAUTH_PROVIDER}` as const;

/**
 * Decap matches `/^authorization:github:success:(.+)$/` and JSON.parses group 1.
 * JS `.` does not match `\n`, so the payload must stay newline-free --
 * JSON.stringify output is, and it must remain the only thing interpolated here.
 */
export const buildSuccessMessage = (provider: string, token: string): string =>
  `authorization:${provider}:success:${JSON.stringify({ token, provider })}`;

export const buildErrorMessage = (provider: string, message: string): string =>
  `authorization:${provider}:error:${JSON.stringify({ message })}`;

/** Neutralise `</script>`, U+2028 and U+2029 before inlining JSON into HTML. */
export const escapeForScript = (value: string): string =>
  value
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

/** Early-exit on length is fine: the state length is a fixed constant. */
export const constantTimeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

export const buildAuthorizeUrl = (input: {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
}): string => {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", input.scope);
  url.searchParams.set("state", input.state);
  url.searchParams.set("allow_signup", "false");
  return url.toString();
};

/**
 * The popup page that performs Decap's two-step postMessage handshake:
 *
 *   1. popup  -> opener : "authorizing:github"           (to "*", a constant)
 *   2. opener -> popup  : same string echoed back
 *   3. popup  -> opener : "authorization:github:success:{...}"  (verified origin only)
 *
 * The token is never posted to "*". The readiness ping is, because it is a
 * constant and leaks nothing.
 */
export const renderHandshakeHtml = (message: string, allowedOrigin: string): string => {
  const messageLiteral = escapeForScript(JSON.stringify(message));
  const originLiteral = escapeForScript(JSON.stringify(allowedOrigin));
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Authorizing</title></head>
<body>
<p id="status">Completing sign-in&hellip;</p>
<script>
(function () {
  var message = ${messageLiteral};
  var allowedOrigin = ${originLiteral};
  if (!window.opener) {
    document.getElementById("status").textContent = "Open this from the CMS at /admin/.";
    return;
  }
  function receive(e) {
    if (e.origin !== allowedOrigin) return;
    if (e.data !== ${JSON.stringify(OAUTH_HANDSHAKE_MESSAGE)}) return;
    window.removeEventListener("message", receive, false);
    window.opener.postMessage(message, e.origin);
  }
  window.addEventListener("message", receive, false);
  window.opener.postMessage(${JSON.stringify(OAUTH_HANDSHAKE_MESSAGE)}, "*");
})();
</script>
</body>
</html>`;
};
