import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { selectPublished } from "../lib/posts";
import { SITE } from "../site";

export async function GET(context: APIContext) {
  const posts = selectPublished(await getCollection("blog"));
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: [...post.data.tags],
    })),
    customData: `<language>en-us</language>`,
  });
}
