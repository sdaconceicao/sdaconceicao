import type { ImageMetadata } from "astro";

type ImageModuleMap = Record<string, { default: ImageMetadata }>;

/**
 * Eagerly globbed so every co-located blog image is a build-time known asset.
 * Keys are root-relative: "/src/content/blog/<slug>/hero.jpg".
 */
const blogImages = import.meta.glob<{ default: ImageMetadata }>(
  "/src/content/blog/**/*.{jpeg,jpg,png,webp,avif,gif}",
  { eager: true },
) as ImageModuleMap;

/**
 * Maps a bare filename back to a root-relative module key.
 *
 * Why this exists: Decap's selectMediaFilePublicPath does
 * `path.join(publicFolder, basename(mediaPath))`, and with the blog collection's
 * public_folder set to "" that yields a BARE filename ("hero.jpg"). path.join
 * also strips a leading "./", so no Decap config can produce the "./hero.jpg"
 * that Astro's image() helper requires.
 *
 * Do NOT "simplify" blog.heroImage to image() -- the build breaks with an
 * unhelpful Vite resolution error.
 */
export const buildImageKey = (entryFilePath: string, filename: string): string => {
  const dir = entryFilePath.replace(/\/[^/]+$/, "");
  const normalized = filename.replace(/^\.?\//, "");
  return `/${dir}/${normalized}`.replace(/\/{2,}/g, "/");
};

export const resolveEntryImage = (
  entryFilePath: string | undefined,
  filename: string | undefined,
  modules: ImageModuleMap = blogImages,
): ImageMetadata | undefined => {
  if (!entryFilePath || !filename) return undefined;
  return modules[buildImageKey(entryFilePath, filename)]?.default;
};
