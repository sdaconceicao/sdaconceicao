import React from 'react';
import Link from 'components/Link';
import useStyles from './index.styles';

const Nav = () => {
  const classes = useStyles();
  return (
    <nav className={classes.nav}>
      <div className={classes.content}>
        <div className={classes.logo}>
          <Link to="about">Stephen Andrew Designs</Link>
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

export default Nav;
