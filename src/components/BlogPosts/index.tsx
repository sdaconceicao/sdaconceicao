import React from 'react';
import { Link } from 'gatsby';
import { GatsbyImage, getImage, ImageDataLike } from 'gatsby-plugin-image';
import useStyles from './index.styles';

const BlogPosts = ({ posts }: BlogPosts) => {
  const classes = useStyles();

  if (posts.length < 1) {
    return (
      <p>
        No blog posts found. Add markdown posts to "content/blog" (or the directory you specified
        for the "gatsby-source-filesystem" plugin in gatsby-config.js).
      </p>
    );
  }
  return (
    <ol className={classes.posts}>
      {posts.map((post) => {
        const title = post.frontmatter.title || post.fields.slug;
        const image = getImage(post.frontmatter.featuredImage);
        return (
          <li key={post.fields.slug}>
            <article className="post-list-item" itemScope itemType="http://schema.org/Article">
              <header>
                <h2>
                  <Link to={post.fields.slug} itemProp="url">
                    <GatsbyImage image={image} alt={post.title} />
                    <span itemProp="headline">{title}</span>
                  </Link>
                </h2>
                <small>{post.frontmatter.date}</small>
              </header>
              <section>
                <p
                  dangerouslySetInnerHTML={{
                    __html: post.frontmatter.description || post.excerpt
                  }}
                  itemProp="description"
                />
              </section>
            </article>
          </li>
        );
      })}
    </ol>
  );
};

export interface BlogPosts {
  posts: [
    {
      excerpt?: string;
      title: string;
      fields: {
        slug: string;
      };
      frontmatter: {
        date: string;
        description: string;
        featuredImage: ImageDataLike;
        title: string;
      };
    }
  ];
}

export default BlogPosts;