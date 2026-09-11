# Deploying stephenandrewdesigns.com

The public site is a static Astro build served by GitHub Pages. Vercel serves
only the two Decap CMS OAuth endpoints:

| Responsibility | Host |
| --- | --- |
| Site, blog, assets, and `/admin/` | `https://stephenandrewdesigns.com` (GitHub Pages) |
| `/api/auth` and `/api/callback` | `https://auth.stephenandrewdesigns.com` (Vercel) |

Both deployments track `main`. A CMS save commits to `main`; CI validates
the content and deploys the new static build to GitHub Pages. Vercel publishes
only the project rooted under `oauth/`.

## One-time setup

### 1. Vercel OAuth project

Import `sdaconceicao/sdaconceicao` into Vercel with these project settings:

| Setting | Value |
| --- | --- |
| Project name | `stephenandrewdesigns-cms-auth` |
| Framework Preset | Other |
| Root Directory | `oauth` |
| Production Branch | `main` |
| Build Command | Leave unset |
| Output Directory | Leave unset |
| Install Command | Leave unset |

The root directory is load-bearing. It keeps Vercel from building or serving a
second copy of the portfolio; the project contains only the two functions,
their shared OAuth code, and a small status page at `/`.

In Vercel → Project → Settings → Domains, add
`auth.stephenandrewdesigns.com`, then add this record at GoDaddy:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `auth` | `749eb4bc98f44858.vercel-dns-017.com` |

This is the project-specific value Vercel currently requires. Do not change the
apex or `www` records used by GitHub Pages. Wait for Vercel to report **Valid
Configuration** and issue the certificate before testing OAuth.

### 2. GitHub OAuth App

GitHub → Settings → Developer settings → **OAuth Apps** → New OAuth App. Use an
OAuth App, not a GitHub App; Decap speaks the OAuth App flow.

| Field | Value |
| --- | --- |
| Application name | `stephenandrewdesigns.com CMS` |
| Homepage URL | `https://stephenandrewdesigns.com` |
| Application description | Leave blank |
| Redirect URI | `https://auth.stephenandrewdesigns.com/api/callback` |

Set the options below the redirect URI as follows:

| Option | Setting |
| --- | --- |
| Allow wildcard matching | Off |
| Enable Device Flow | Off |
| Expire user access tokens | Off |

Register the app, then generate a client secret. Copy the client ID and secret
before leaving the page; GitHub shows the secret only once.

Leave token expiration off. The callback passes Decap the access token but does
not implement GitHub's refresh-token flow, so an expiring token would eventually
break an otherwise valid CMS session.

### 3. Vercel environment variables

Add both values in Vercel → Project → Settings → Environment Variables and
scope them to **Production only**:

```
GITHUB_OAUTH_CLIENT_ID
GITHUB_OAUTH_CLIENT_SECRET
```

Redeploy the production deployment after adding them. Do not add them to
Preview or Development: those hosts are not registered OAuth callbacks and do
not need credentials with repository write access.

### 4. GitHub Pages

The workflow in `.github/workflows/ci.yml` builds `dist/`, uploads it as the
Pages artifact, and deploys only after lint, typecheck, unit, build, and
Playwright checks pass on `main`.

In GitHub → repository Settings → Pages:

1. Set **Source** to **GitHub Actions**.
2. Set the custom domain to `stephenandrewdesigns.com`.
3. Keep **Enforce HTTPS** enabled.

The existing apex and `www` DNS records must continue to point to GitHub Pages.
`public/CNAME` places the custom domain in every built artifact.

After the first Actions deployment succeeds, verify `/`, `/blog`, a post,
`/rss.xml`, `/sitemap-index.xml`, and `/admin/`. Then delete the stale `docs/`
directory in a separate commit; it is no longer a Pages source once GitHub
Actions is selected.

Submit `https://stephenandrewdesigns.com/sitemap-index.xml` in Search Console.

## Editing content

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
