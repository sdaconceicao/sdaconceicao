import { describe, expect, it } from "vitest";
import {
  buildAuthorizeUrl,
  buildErrorMessage,
  buildSuccessMessage,
  constantTimeEqual,
  escapeForScript,
  OAUTH_HANDSHAKE_MESSAGE,
  renderHandshakeHtml,
} from "./oauth";

describe("buildSuccessMessage", () => {
  // The single most important assertion in this repo. Decap matches
  // /^authorization:github:success:(.+)$/ and JSON.parses group 1. One wrong
  // character here means the login popup hangs forever with no error anywhere.
  it("matches Decap's expected wire format exactly", () => {
    expect(buildSuccessMessage("github", "abc")).toBe(
      'authorization:github:success:{"token":"abc","provider":"github"}',
    );
  });

  it("is parseable by Decap's own regex", () => {
    const message = buildSuccessMessage("github", "gho_deadbeef");
    const match = message.match(/^authorization:github:success:(.+)$/);
    expect(match?.[1]).toBeDefined();
    expect(JSON.parse(match?.[1] ?? "{}")).toEqual({
      token: "gho_deadbeef",
      provider: "github",
    });
  });

  it("never emits a newline, which JS '.' would fail to match", () => {
    expect(buildSuccessMessage("github", "a\nb")).not.toMatch(/\n/);
    expect(buildSuccessMessage("github", "a\nb")).toMatch(/^authorization:github:success:(.+)$/);
  });
});

describe("buildErrorMessage", () => {
  it("matches the error wire format", () => {
    expect(buildErrorMessage("github", "nope")).toBe(
      'authorization:github:error:{"message":"nope"}',
    );
  });

  it("stays on one line even for a multi-line reason", () => {
    expect(buildErrorMessage("github", "line1\nline2")).not.toMatch(/\n/);
  });
});

describe("escapeForScript", () => {
  it("neutralises a script-closing tag", () => {
    expect(escapeForScript("</script>")).toBe("\\u003c/script\\u003e");
  });

  it("escapes ampersands", () => {
    expect(escapeForScript("a&b")).toBe("a\\u0026b");
  });

  it("escapes the JS line terminators that would break a string literal", () => {
    expect(escapeForScript("a\u2028b")).toBe("a\\u2028b");
    expect(escapeForScript("a\u2029b")).toBe("a\\u2029b");
  });

  it("leaves ordinary text alone", () => {
    expect(escapeForScript("hello world")).toBe("hello world");
  });
});

describe("constantTimeEqual", () => {
  it("is true for identical strings", () => {
    expect(constantTimeEqual("abc123", "abc123")).toBe(true);
  });

  it("is false for equal-length differing strings", () => {
    expect(constantTimeEqual("abc123", "abc124")).toBe(false);
  });

  it("is false for differing lengths", () => {
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });

  it("is true for two empty strings", () => {
    expect(constantTimeEqual("", "")).toBe(true);
  });
});

describe("buildAuthorizeUrl", () => {
  const url = buildAuthorizeUrl({
    clientId: "cid",
    redirectUri: "https://example.com/api/callback",
    scope: "public_repo",
    state: "st",
  });

  it("points at GitHub's authorize endpoint", () => {
    expect(url.startsWith("https://github.com/login/oauth/authorize?")).toBe(true);
  });

  it("carries every parameter GitHub needs", () => {
    const params = new URL(url).searchParams;
    expect(params.get("client_id")).toBe("cid");
    expect(params.get("redirect_uri")).toBe("https://example.com/api/callback");
    expect(params.get("scope")).toBe("public_repo");
    expect(params.get("state")).toBe("st");
    expect(params.get("allow_signup")).toBe("false");
  });
});

describe("renderHandshakeHtml", () => {
  const html = renderHandshakeHtml(buildSuccessMessage("github", "tok"), "https://example.com");

  it("posts the readiness ping to '*' but never the token", () => {
    expect(html).toContain(`postMessage("${OAUTH_HANDSHAKE_MESSAGE}", "*")`);
    // The token is only ever posted to e.origin, after an origin check.
    expect(html).toContain("window.opener.postMessage(message, e.origin)");
    expect(html).not.toMatch(/postMessage\(message,\s*"\*"\)/);
  });

  it("verifies the sender origin before echoing", () => {
    expect(html).toContain("if (e.origin !== allowedOrigin) return;");
  });

  it("degrades with a readable message when opened without an opener", () => {
    expect(html).toContain("if (!window.opener)");
    expect(html).toContain("Open this from the CMS at /admin/.");
  });

  it("is noindexed", () => {
    expect(html).toContain('name="robots" content="noindex,nofollow"');
  });

  it("escapes a hostile token rather than emitting a raw script tag", () => {
    const hostile = renderHandshakeHtml(
      buildSuccessMessage("github", "</script><script>alert(1)</script>"),
      "https://example.com",
    );
    expect(hostile).not.toContain("<script>alert(1)</script>");
    expect(hostile).toContain("\\u003c");
  });
});
