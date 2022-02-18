import React from 'react';
import useGetBio from 'hooks/useGetBio';
import Contact from 'components/Contact';
import useStyles from './index.styles';

const About = () => {
  const classes = useStyles();
  const data = useGetBio();
  const { author, contact } = data.site.siteMetadata;

  return (
    <div className={classes.about}>
      <div className={classes.content}>
        <div className={classes.summary}>
          <h3 className={classes.intro}> Hi, my name is {author.name}</h3>
          <p className={classes.description}>
            I'm a software engineer with over 15 years of experience in frontend development, with a
            focus on a11y and i18n
          </p>
        </div>
        <div className={classes.contact}>
          <Contact list={contact} />
        </div>
      </div>
    </div>
  );
};

export default About;
