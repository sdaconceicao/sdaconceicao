import React, { useState } from 'react';
import Link from 'components/Link';
import { FaBars } from '@react-icons/all-files/fa/FaBars';
import { FaTimes } from '@react-icons/all-files/fa/FaTimes';
import useStyles from './index.styles';

const Nav = () => {
  const [open, setOpen] = useState(false);
  const classes = useStyles({ open });
  return (
    <nav className={classes.nav}>
      <div className={classes.content}>
        <div className={classes.logo}>
          <Link to="home">Stephen Andrew Designs</Link>
        </div>
        <button
          className={classes.btnMenu}
          onClick={() => {
            setOpen(!open);
          }}
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
        <ul className={classes.list}>
          <li className={classes.listItem}>
            <Link to="about" className={classes.listItemLink}>
              About
            </Link>
          </li>
          <li className={classes.listItem}>
            <Link to="portfolio" className={classes.listItemLink}>
              Portfolio
            </Link>
          </li>
          <li className={classes.listItem}>
            <Link to="blog" className={classes.listItemLink}>
              Blog
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Nav;
