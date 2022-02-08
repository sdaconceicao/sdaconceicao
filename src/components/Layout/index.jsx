import React from 'react';
import { ThemeProvider } from 'react-jss';
import theme from '../../theme/theme';
import Nav from '../Nav';
import useStyles from './index.styles';

const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`;
  const isRootPath = location.pathname === rootPath;
  const classes = useStyles();
  return (
    <ThemeProvider theme={theme}>
      <div data-is-root-path={isRootPath}>
        <header className={classes.header}>
          <Nav />
        </header>
        <main>{children}</main>
        <footer>
          © {new Date().getFullYear()}, Built with
          {` `}
          <a href="https://www.gatsbyjs.com">Gatsby</a>
        </footer>
      </div>
    </ThemeProvider>
  );
};

export default Layout;
