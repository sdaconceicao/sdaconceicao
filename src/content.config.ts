import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Astro 6+ requires every collection to declare a Content Layer loader, and this
 * file must live at src/content.config.ts (NOT src/content/config.ts).
 *
 * Alt text is conditionally required via .refine() on both image-bearing
 * collections, so a missing alt is a build error rather than a review comment.
 */

const blog = defineCollection({
  loader: glob({ pattern: "**/index.mdx", base: "./src/content/blog" }),
  schema: z
    .object({
      title: z.string().min(1).max(120),
      description: z.string().min(1).max(300),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      draft: z.boolean().default(true),
      tags: z.array(z.string().min(1)).default([]),
      /**
       * A BARE filename co-located with index.mdx (e.g. "hero.jpg").
       *
       * This is z.string() and not image() on purpose. Decap's
       * selectMediaFilePublicPath does path.join(publicFolder, basename(path)),
       * and with this collection's public_folder set to "" that yields a bare
       * filename -- path.join also strips a leading "./", so no Decap config can
       * produce the "./hero.jpg" that image() requires.
       *
       * Resolve it through resolveEntryImage() in src/lib/images.ts. Switching
       * this to image() breaks the build with an opaque Vite resolution error.
       */
      heroImage: z.string().optional(),
      heroImageAlt: z.string().default(""),
      canonicalUrl: z.string().url().optional(),
    })
    .refine((data) => !data.heroImage || data.heroImageAlt.trim().length > 0, {
      message: "heroImageAlt is required when heroImage is set",
      path: ["heroImageAlt"],
    })
    .refine((data) => !data.updatedDate || data.updatedDate >= data.pubDate, {
      message: "updatedDate cannot precede pubDate",
      path: ["updatedDate"],
    }),
});

const jobs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/jobs" }),
  schema: z
    .object({
      company: z.string().min(1),
      title: z.string().min(1),
      dateStart: z.coerce.date(),
      dateEnd: z.coerce.date().optional(),
      current: z.boolean().default(false),
      location: z.string().optional(),
      employmentType: z
        .enum(["full-time", "part-time", "contract", "freelance"])
        .default("full-time"),
      url: z.string().url().optional(),
      summary: z.string().min(1).max(400),
      /** Named to match JSON Resume, so a resume export stays a pure mapping. */
      highlights: z.array(z.string().min(1)).default([]),
      tech: z.array(z.string().min(1)).default([]),
      /** Manual tie-break for same-month roles only. Default sort is by date. */
      order: z.number().int().optional(),
    })
    .refine((data) => data.current || data.dateEnd !== undefined, {
      message: "dateEnd is required unless current is true",
      path: ["dateEnd"],
    })
    .refine((data) => !data.dateEnd || data.dateEnd >= data.dateStart, {
      message: "dateEnd cannot precede dateStart",
      path: ["dateEnd"],
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/index.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1).max(80),
        description: z.string().min(1).max(300),
        url: z.string().url().optional(),
        repo: z.string().url().optional(),
        tech: z.array(z.string().min(1)).default([]),
        featured: z.boolean().default(false),
        /** Hand-authored, so a relative "./cover.png" resolves through image(). */
        image: image().optional(),
        imageAlt: z.string().default(""),
        year: z.number().int().min(1990).max(2100).optional(),
        status: z.enum(["live", "archived", "wip"]).default("live"),
        order: z.number().int().default(999),
      })
      .refine((data) => !data.image || data.imageAlt.trim().length > 0, {
        message: "imageAlt is required when image is set",
        path: ["imageAlt"],
      })
      .refine((data) => data.url !== undefined || data.repo !== undefined, {
        message: "a project needs at least one of url or repo",
        path: ["url"],
      }),
});

export const collections = { blog, jobs, projects };
