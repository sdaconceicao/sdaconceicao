import React from 'react';
import { Link } from 'gatsby';
import useStyles from './index.styles';

const Projects = ({ projects }) => {
  const classes = useStyles();

  return (
    <ol className={classes.projects}>
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
                <small>{project.frontmatter.date}</small>
              </header>
              <section>
                <p
                  dangerouslySetInnerHTML={{
                    __html: project.frontmatter.description || project.excerpt
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

export default Projects;
