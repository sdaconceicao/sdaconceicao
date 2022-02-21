import React from 'react';

import useGetBio from 'hooks/useGetBio';
import Social from 'components/Social';
import useStyles from './index.styles';
import img from '../../images/me.png';

const About = () => {
  const classes = useStyles();
  const data = useGetBio();
  const { author, social } = data.site.siteMetadata;

  return (
    <div className={classes.about}>
      <div className={classes.avatar}>
        <img className={classes.avatarImage} src={img} alt="Profile picture" />
      </div>
      <div className={classes.content}>
        <div className={classes.summary}>
          <h3 className={classes.intro}> Hi, my name is {author.name}</h3>
          <p className={classes.description}>
            I'm a software engineer with over 15 years of experience in frontend development, with a
            focus on a11y and i18n
          </p>
        </div>
        <div className={classes.social}>
          <h3 className={classes.followMe}> You can follow me at </h3>
          <Social list={social} buttonClassname={classes.socialButtons} />
        </div>
      </div>
    </div>
  );
};

export default About;
