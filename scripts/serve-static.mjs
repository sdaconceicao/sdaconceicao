/**
 * Minimal static file server for the Playwright suite.
 *
 * Why this exists: `astro preview` is not supported once an adapter is
 * configured, and @astrojs/vercel provides no preview server. Running the tests
 * against `astro dev` instead would work for most assertions but would lose
 * /sitemap-index.xml, which only exists after a build -- so the SEO spec would
 * silently test nothing. Serving dist/client tests the real built artifact.
 *
 * The /api/* OAuth routes are serverless and NOT served here. Their wire format
 * is pinned by unit tests in src/lib/oauth.test.ts instead, which is the part
 * that actually breaks silently.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(process.argv[2] ?? "dist/client");
const PORT = Number(process.env.PORT ?? 4321);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".yml": "text/yaml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/** Astro's directory build format: /blog -> /blog/index.html, /404 -> /404.html. */
const resolveFile = (pathname) => {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const base = join(ROOT, rel);
  const candidates = [base, `${base}.html`, join(base, "index.html")];
  return candidates.find((c) => c.startsWith(ROOT) && existsSync(c) && statSync(c).isFile());
};

createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);
  const file = resolveFile(pathname);

  if (!file) {
    const notFound = join(ROOT, "404.html");
    if (existsSync(notFound)) {
      res.writeHead(404, { "content-type": TYPES[".html"] });
      createReadStream(notFound).pipe(res);
      return;
    }
    res.writeHead(404).end("Not found");
    return;
  }

  const headers = { "content-type": TYPES[extname(file)] ?? "application/octet-stream" };
  // Mirror the /admin/* headers from vercel.json so the SEO spec is meaningful.
  if (pathname.startsWith("/admin")) {
    headers["x-robots-tag"] = "noindex, nofollow";
    headers["cache-control"] = "no-store";
  }
  res.writeHead(200, headers);
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`Serving ${ROOT} on http://localhost:${PORT}`);
});
