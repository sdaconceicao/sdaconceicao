import React from 'react';
import { ThemeProvider } from 'react-jss';
import theme from './src/theme/theme';
import '@fontsource/roboto';
import 'reset-css';

export const wrapRootElement = ({ element }) => (
  <ThemeProvider theme={theme}>{element}</ThemeProvider>
);
