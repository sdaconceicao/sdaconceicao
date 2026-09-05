# Deploying stephenandrewdesigns.com

The site is a static Astro build on Vercel, plus exactly two serverless
functions (`/api/auth`, `/api/callback`) that exist only to back the Decap CMS
GitHub login.

## One-time setup

### 1. GitHub OAuth App

GitHub → Settings → Developer settings → **OAuth Apps** → New OAuth App.
Not a GitHub App — Decap speaks the OAuth App flow.

| Field | Value |
| --- | --- |
| Application name | `stephenandrewdesigns.com CMS` |
| Homepage URL | `https://stephenandrewdesigns.com` |
| Authorization callback URL | `https://stephenandrewdesigns.com/api/callback` |

The callback URL is a **single exact value**. This is why `/admin/` login works
only on production and never on a `*.vercel.app` preview or on localhost. That
is correct, not a bug — see "Editing content locally" below.

### 2. Vercel environment variables

Set both, **Production only**:

```
GITHUB_OAUTH_CLIENT_ID
GITHUB_OAUTH_CLIENT_SECRET
```

Do not add them to Preview. Preview deploys get random hostnames that can never
match the OAuth App's callback URL, so leaving OAuth unconfigured there is the
correct fail-closed state.

## DNS cutover from GitHub Pages — order matters

The domain currently points at GitHub Pages (apex A records, `www` CNAME →
`sdaconceicao.github.io`, TTL 600, registrar GoDaddy). GoDaddy has no apex ALIAS
support, so the apex must use Vercel's A record.

1. Push the branch and import the repo into Vercel. Verify the `*.vercel.app`
   deployment: `/`, `/blog`, a post, `/rss.xml`, `/sitemap-index.xml`, and
   `/admin/` (200, shell renders). **`/admin/` login will fail here — expected.**
2. Vercel → Settings → Domains: add both `stephenandrewdesigns.com` and
   `www.stephenandrewdesigns.com`. Apex primary, `www` as a 308 redirect to it.
   Vercel will show "Invalid Configuration" until step 3 — expected.
3. GoDaddy DNS. **Read the exact values off the Vercel Domains page.** Do not
   copy them from a blog post: the `www` CNAME target is now project-specific
   (e.g. `…vercel-dns-017.com`), not the old `cname.vercel-dns.com`.
   - Delete the four GitHub Pages A records on `@`
   - Add the A record Vercel shows for `@`
   - Repoint the `www` CNAME to the target Vercel shows
4. Wait for the domain to go green and the certificate to issue. At TTL 600 this
   is usually under 5 minutes. Confirm:
   ```bash
   dig +short stephenandrewdesigns.com
   curl -sI https://stephenandrewdesigns.com | head -1
   ```
5. **Only now:** GitHub → repo Settings → Pages → Source: **None**. This releases
   GitHub's claim on the custom domain and stops Pages serving stale content.
6. **Only now:** delete `docs/` and commit. Doing this before step 5 takes the
   live site down for the DNS TTL window.
7. Add HSTS to `vercel.json` once HTTPS is confirmed working:
   ```json
   { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains" }
   ```
   Leave `preload` **off** — it is effectively irreversible.
8. Submit `https://stephenandrewdesigns.com/sitemap-index.xml` in Search Console.

No redirects are needed. The old site was a single `index.html`, and the
`/storybook` link it advertised never existed.

## Editing content

### In the browser (production)

Go to `/admin/`, sign in with GitHub. Saves commit **directly to `master`** and
trigger a production deploy — editorial workflow is deliberately off. New posts
default to `draft: true`, which builds a previewable, `noindex`ed URL while
staying off `/blog`, the RSS feed, and the sitemap.

### Locally (no GitHub app needed)

```bash
pnpm dev        # terminal 1 -> http://localhost:4321
pnpm cms:dev    # terminal 2 -> decap-server proxy on :8081
```

Then open `http://localhost:4321/admin/`. Decap detects the proxy and bypasses
GitHub entirely, writing straight to `src/content/blog/`. `local_backend: true`
is safe to ship because Decap gates it to `localhost`/`127.0.0.1`.

## If `/admin/` login hangs with no error

This is nearly always `base_url` in `public/admin/config.yml`. Decap compares
`event.origin === this.base_url` with a strict `===`, and a mismatch produces no
console error and no failed request — the popup just spins forever.

Open the live `/admin/`, type `window.location.origin` in the console, and paste
that exact string. No `www.`, no `http:`, no trailing slash, no path.

## Bumping Decap

`public/admin/index.html` pins `decap-cms@3.15.1` with an SRI hash, because that
bundle holds a token with write access to this repo. Recompute on every bump:

```bash
curl -sL https://cdn.jsdelivr.net/npm/decap-cms@<version>/dist/decap-cms.js \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

Never use a floating range there — a floating range and an SRI hash are mutually
exclusive, and the range is the actual risk.
