import React from 'react';
import useStyles from './index.styles';
import Project, { ProjectProps } from '../Project';

const Projects = ({ projects }: ProjectsProps) => {
  const classes = useStyles();

  return (
    <div className={classes.projects}>
      <h3>Projects</h3>
      <ul>
        {projects.map((project) => (
          <li key={project.fields.slug}>
            <Project {...project} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export interface ProjectsProps {
  projects: [ProjectProps];
}

export default Projects;
