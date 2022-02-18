import React from 'react';
import { Link } from 'gatsby';
import useStyles from './index.styles';
import { ImageDataLike } from 'gatsby-plugin-image';

const Project = ({ frontmatter, fields, excerpt }: ProjectProps) => {
  const classes = useStyles();

  const title = frontmatter.title || fields.slug;
  return (
    <article className={classes.post} itemScope itemType="http://schema.org/Article">
      <header>
        <h2>
          <Link to={fields.slug} itemProp="url">
            <span itemProp="headline">{title}</span>
          </Link>
        </h2>
      </header>
      <section>
        <p>{frontmatter.description || excerpt}</p>
      </section>
    </article>
  );
};

export interface ProjectProps {
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

export default Project;
