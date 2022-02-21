import React from 'react';
import { Link } from 'gatsby';
import useStyles from './index.styles';
import { GatsbyImage, getImage, ImageDataLike } from 'gatsby-plugin-image';

const Post = ({ frontmatter, fields, excerpt }: PostProps) => {
  const classes = useStyles();
  const title = frontmatter.title || fields.slug;
  const image = getImage(frontmatter.featuredImage);

  return (
    <div className={classes.post} itemScope itemType="http://schema.org/Article">
      <div className={classes.featuredImage}>
        <Link to={fields.slug} itemProp="url">
          {image && <GatsbyImage alt={title} className={classes.image} image={image} />}
        </Link>
      </div>
      <article className={classes.content}>
        <header>
          <h3>
            <Link to={fields.slug} itemProp="url">
              <span className={classes.title} itemProp="headline">
                {title}
              </span>
            </Link>
            <small className={classes.date}>{frontmatter.date}</small>
          </h3>
        </header>
        <section>
          <p className={classes.excerpt} itemProp="description">
            {frontmatter.description || excerpt}
          </p>
          <Link to={fields.slug} itemProp="url" className={classes.readMore}>
            Read More -&gt;
          </Link>
        </section>
      </article>
    </div>
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
