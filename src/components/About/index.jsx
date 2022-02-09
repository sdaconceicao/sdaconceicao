import React from 'react';
import useGetBio from '../../hooks/useGetBio';
import useStyles from './index.styles';

const About = () => {
  const classes = useStyles();
  const data = useGetBio();
  const { author, social } = data.site.siteMetadata;

  return (
    <div className={classes.about}>
      {author.name}
      {author.summary}
    </div>
  );
};

export default About;
