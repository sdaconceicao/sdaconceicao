import React from 'react';
import Nav from 'components/Nav';
import useGetBio from 'hooks/useGetBio';
import useStyles from './index.styles';

const Layout = ({ location, children, headerContent }: LayoutProps) => {
  const rootPath = `${__PATH_PREFIX__}/`;
  const isRootPath = location.pathname === rootPath;
  const data = useGetBio();
  const { author, title } = data.site.siteMetadata;
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
      <footer className={classes.footer}>
        <div className={classes.footerContent}>
          <div className={classes.designed}>
            <em>Designed by</em> {author.name}
          </div>
          <div className={classes.copyright}>
            {title} © {new Date().getFullYear()} - All Rights Reserved
          </div>
        </div>
      </footer>
    </div>
  );
};

export interface LayoutProps {
  location: {
    pathname: string;
  };
  children: React.ReactNode;
  headerContent?: React.ReactNode | string;
}

export default Layout;
