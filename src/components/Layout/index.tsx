import React from 'react';
import Nav from '../Nav';
import useStyles from './index.styles';

const Layout = ({ location, children, headerContent }: Layout) => {
  const rootPath = `${__PATH_PREFIX__}/`;
  const isRootPath = location.pathname === rootPath;
  const classes = useStyles();
  return (
    <div data-is-root-path={isRootPath}>
      <header className={classes.header}>
        <Nav />
        {headerContent}
      </header>
      <main className={classes.main}>
        <div className={classes.content}>{children}</div>
      </main>
      <footer className={classes.footer}>© {new Date().getFullYear()}</footer>
    </div>
  );
};

export interface Layout {
  location: {
    pathname: string;
  };
  children: React.ReactNode;
  headerContent?: React.ReactNode | string;
}

export default Layout;
