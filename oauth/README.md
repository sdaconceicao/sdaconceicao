# Vercel functions

This directory is the root of the Vercel project at `auth.stephenandrewdesigns.com`.

The Projects page requests `/api/activity` when it is visible. Set
`GITHUB_ACTIVITY_TOKEN` in that Vercel project's server-side environment, then
redeploy the Vercel project. Create a fine-grained personal access token with
your account as resource owner and leave optional repository, organization, and
account permissions unset. GitHub includes read access to public repositories
on every fine-grained token.  The public response is cached at Vercel for 30 minutes.

For local development, copy `.env.example` to `.env` in the repository root and
put your GitHub token in `GITHUB_ACTIVITY_TOKEN`. The real `.env` is ignored by
Git. Then run:

```bash
pnpm dev
```

Astro serves `/api/activity` locally using the same handler; the browser calls
this local route.
