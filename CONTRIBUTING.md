
# Contributing

## Blog Content

### In the browser (production)

Go to `https://stephenandrewdesigns.com/admin/` and sign in with GitHub. Saves
commit directly to `main` and trigger the GitHub Pages workflow. Editorial
workflow is deliberately off. New posts default to `draft: true`, which builds
a previewable, `noindex`ed URL while staying off `/blog`, the RSS feed, and the
sitemap.

### Locally (no GitHub app needed)

```bash
pnpm dev        # terminal 1 -> http://localhost:4321
pnpm cms:dev    # terminal 2 -> decap-server proxy on :8081
```

Then open `http://localhost:4321/admin/`. Decap detects the proxy and bypasses
GitHub entirely, writing straight to `src/content/blog/`. `local_backend: true`
is safe to ship because Decap gates it to `localhost`/`127.0.0.1`.

## If `/admin/` login hangs with no error

Check all three origins; each has a different role:

| Location | Required value |
| --- | --- |
| `public/admin/config.yml` `base_url` | `https://auth.stephenandrewdesigns.com` |
| GitHub OAuth redirect URI | `https://auth.stephenandrewdesigns.com/api/callback` |
| `PUBLIC_SITE_ORIGIN` in `oauth/lib/oauth.ts` | `https://stephenandrewdesigns.com` |

Decap strictly compares the popup's origin with `base_url`. The callback also
accepts handshake messages only from the public-site origin. A mismatch can
leave the popup spinning without a useful browser error.

Also confirm that both Vercel environment variables exist in Production and
that the deployment was rebuilt after they were added.

## Bumping Decap

`public/admin/index.html` pins `decap-cms@3.15.1` with an SRI hash, because that
bundle holds a token with write access to this repo. Recompute on every bump:

```bash
curl -sL https://cdn.jsdelivr.net/npm/decap-cms@<version>/dist/decap-cms.js \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

Never use a floating range there — a floating range and an SRI hash are mutually
exclusive, and the range is the actual risk.
