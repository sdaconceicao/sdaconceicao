import type { CollectionEntry } from "astro:content";

type Post = CollectionEntry<"blog">;

export const sortPostsByDate = (posts: Post[]): Post[] =>
  [...posts].sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

export const isPublished = (post: Post): boolean => post.data.draft === false;

/** Published only, newest first. What /blog, RSS, and the sitemap all use. */
export const selectPublished = (posts: Post[]): Post[] =>
  sortPostsByDate(posts.filter(isPublished));

export const selectByTag = (posts: Post[], tag: string): Post[] =>
  selectPublished(posts).filter((post) =>
    post.data.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
  );

export const collectTags = (posts: Post[]): string[] =>
  [...new Set(selectPublished(posts).flatMap((post) => post.data.tags))].sort((a, b) =>
    a.localeCompare(b),
  );

export const selectFeaturedArticle = (
  posts: Post[],
): { featuredPost: Post | undefined; otherPosts: Post[] } => {
  const published = selectPublished(posts);
  const featuredPost = published.find((post) => post.data.featured) ?? published[0];

  return {
    featuredPost,
    otherPosts: featuredPost ? published.filter((post) => post.id !== featuredPost.id) : [],
  };
};

/** The "Writing" teaser on the homepage. */
export const selectLatest = (posts: Post[], count: number): Post[] =>
  selectPublished(posts).slice(0, Math.max(0, count));
