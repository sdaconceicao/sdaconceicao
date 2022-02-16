import React from 'react';
import Link from '../Link';
import useStyles from './index.styles';

const Nav = () => {
  const classes = useStyles();
  return (
    <nav className={classes.nav}>
      <div className={classes.content}>
        <div className={classes.logo}>
          <Link to="about" className={classes.link}>
            Stephen Andrew Designs
          </Link>
        </div>
        <ul className={classes.list}>
          <li className={classes.listItem}>
            <Link to="about" className={classes.link}>
              About
            </Link>
          </li>
          <li className={classes.listItem}>
            <Link to="portfolio" className={classes.link}>
              Portfolio
            </Link>
          </li>
          <li className={classes.listItem}>
            <Link to="blog" className={classes.link}>
              Blog
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Nav;
