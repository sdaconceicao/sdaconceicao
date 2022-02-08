import React from 'react';
import Link from '../Link';
import useStyles from './index.styles';

export default () => {
  const classes = useStyles();
  return (
    <nav className={classes.nav}>
      <div className={classes.content}>
        <div className={classes.logo}>
          <Link to="about">Home</Link>
        </div>
        <ul className={classes.list}>
          <li className={classes.listItem}>
            <Link to="about">About</Link>
          </li>
          <li className={classes.listItem}>
            <Link to="portfolio">Portfolio</Link>
          </li>
          <li className={classes.listItem}>
            <Link to="blog">Blog</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};
