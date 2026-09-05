import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { defineConfig, envField } from "astro/config";
import expressiveCode from "astro-expressive-code";

export default defineConfig({
  // Load-bearing: context.site backs the OAuth origin allowlist, canonical URLs,
  // and the sitemap. Without it the OAuth routes fall back to the request origin,
  // which on a preview deploy is the preview host.
  site: "https://stephenandrewdesigns.com",

  // 'static' plus an adapter plus per-route `prerender = false` gives a fully
  // static site with exactly two serverless functions (the Decap OAuth proxy).
  output: "static",
  adapter: vercel({ imageService: false }),

  trailingSlash: "ignore",
  build: { format: "directory" },
  prefetch: { prefetchAll: true, defaultStrategy: "viewport" },

  integrations: [
    expressiveCode({
      themes: ["github-dark-default"],
      useDarkModeMediaQuery: false,
      styleOverrides: {
        codeFontFamily: "var(--font-mono)",
        uiFontFamily: "var(--font-sans)",
        codeFontSize: "var(--text-sm)",
        borderRadius: "var(--radius-lg)",
        borderColor: "var(--border)",
        codeBackground: "var(--code-bg)",
        focusBorder: "var(--focus-ring)",
        frames: {
          frameBoxShadowCssValue: "none",
          editorTabBarBackground: "var(--surface-2)",
          editorActiveTabIndicatorTopColor: "var(--accent)",
        },
      },
    }),
    mdx(),
    sitemap({ filter: (page) => !page.includes("/admin") }),
  ],

  image: { responsiveStyles: true },

  env: {
    schema: {
      // Both optional on purpose: a required astro:env secret throws at module
      // evaluation, which would break `pnpm build` in CI (no secrets there) and
      // `astro dev` (none needed, local_backend bypasses login). The route
      // handlers guard explicitly and return a readable 500 instead.
      GITHUB_OAUTH_CLIENT_ID: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      GITHUB_OAUTH_CLIENT_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
});
