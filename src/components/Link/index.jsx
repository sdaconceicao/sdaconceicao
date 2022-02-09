import React from 'react';
import { Link as GatsbyLink } from 'gatsby';
import useStyles from './index.styles';

const Link = ({ to, dark, children }) => {
  const classes = useStyles({ dark });
  return (
    <GatsbyLink to={to} className={classes.link}>
      {children}
    </GatsbyLink>
  );
};

export default Link;
