import React from 'react';
import { Link } from 'gatsby';
import useStyles from './index.styles';

export default ({ to, dark, children }) => {
  const classes = useStyles({ dark });
  return (
    <Link to={to} className={classes.link}>
      {children}
    </Link>
  );
};
