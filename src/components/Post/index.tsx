import React from 'react';
import { Link } from 'gatsby';
import useStyles from './index.styles';
import { GatsbyImage, getImage, ImageDataLike } from 'gatsby-plugin-image';

const Post = ({ frontmatter, fields, excerpt }: PostProps) => {
  const classes = useStyles();

  const title = frontmatter.title || fields.slug;
  const image = getImage(frontmatter.featuredImage);
  return (
    <article className={classes.post} itemScope itemType="http://schema.org/Article">
      <header>
        <h2>
          <Link to={fields.slug} itemProp="url">
            {image && <GatsbyImage image={image} alt={title} />}
            <span itemProp="headline">{title}</span>
          </Link>
        </h2>
        <small>{frontmatter.date}</small>
      </header>
      <section>
        <p itemProp="description">{frontmatter.description || excerpt}</p>
      </section>
    </article>
  );
};

export interface PostProps {
  body: string;
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

export default Post;
