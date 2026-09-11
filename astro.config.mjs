import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";

export default defineConfig({
  // Load-bearing: canonical URLs, the sitemap, and RSS all use this origin.
  site: "https://stephenandrewdesigns.com",

  // GitHub Pages serves the generated dist/ directory. The Decap OAuth proxy is
  // a separate Vercel project rooted at oauth/.
  output: "static",

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
});
