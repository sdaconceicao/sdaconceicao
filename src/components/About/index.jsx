import React from 'react';
import useGetBio from '../../hooks/useGetBio';
import Contact from '../Contact';
import useStyles from './index.styles';

const About = () => {
  const classes = useStyles();
  const data = useGetBio();
  const { author, contact } = data.site.siteMetadata;

  return (
    <div className={classes.about}>
      <div className={classes.summary}>
        <h3 className={classes.intro}> Hi, my name is {author.name}</h3>
        <p>{author.summary}</p>
      </div>
      <div className={classes.contact}>
        <Contact list={contact} />
      </div>
    </div>
  );
};

export default About;
