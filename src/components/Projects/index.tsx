import React from 'react';
import { Link } from 'gatsby';
import useStyles from './index.styles';
import { ImageDataLike } from 'gatsby-plugin-image';

const Projects = ({ projects }: Projects) => {
  const classes = useStyles();

  return (
    <div className={classes.projects}>
      <h3>Projects</h3>
      <ul>
        {projects.map((project) => {
          const title = project.frontmatter.title || project.fields.slug;
          return (
            <li key={project.fields.slug}>
              <article className="post-list-item" itemScope itemType="http://schema.org/Article">
                <header>
                  <h2>
                    <Link to={project.fields.slug} itemProp="url">
                      <span itemProp="headline">{title}</span>
                    </Link>
                  </h2>
                </header>
                <section>
                  <p>{project.frontmatter.description || project.excerpt}</p>
                </section>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export interface Projects {
  projects: [
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

export default Projects;
