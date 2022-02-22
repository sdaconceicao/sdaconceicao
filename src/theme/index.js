const colors = {
  primary: '#0099FF',
  primaryDark: '#1a4171',
  primaryLight: '#308ce6',
  secondary: '#ccc',
  secondaryDark: '#9a9a9a',
  secondaryLight: '#e0e0e0',
  tertiary: '#646464',
  tertiaryDark: '#202221',
  tertiaryLight: '#a2aaa5',
  success: '#439843',
  successDark: '#2c572c',
  successLight: '#b5eeb5',
  warning: '#f79722',
  warningDark: '#764612',
  warningLight: '#ffca88',
  error: '#de4045',
  errorDark: '#762427',
  errorLight: '#ffbbbb',
  info: '#2a7bca',
  infoDark: '#1a4171',
  infoLight: '#c3ecff',
  white: '#fff',
  g100: '#f1f1f1',
  g200: '#eee',
  g300: '#ddd',
  g400: '#a7a7a7',
  g500: '#808080',
  g600: '#333',
  g700: '#010101',
  black: '#000'
};

const theme = {
  maxWidth: 1120,
  breakpoints: {
    xlarge: '@media screen and (min-width: 1281)',
    large: '@media screen and (min-width: 901px) and (max-width: 1280px)',
    medium: '@media screen and (min-width: 651px) and (max-width: 900px)',
    small: '@media screen and (max-width: 650px)'
  },
  palette: {
    primaryBg: colors.primary,
    primaryFg: colors.white,
    primaryBorder: colors.primary,
    primaryBgHover: colors.primaryDark,
    primaryFgHover: colors.white,
    primaryBorderHover: colors.primaryDark,
    secondaryBg: colors.secondary,
    secondaryFg: colors.g600,
    secondaryBorder: colors.secondaryDark,
    secondaryBgHover: colors.secondaryDark,
    secondaryFgHover: colors.white,
    secondaryBorderHover: colors.secondaryDark,
    text: colors.g500,
    link: colors.primary,
    linkLight: colors.white,
    ...colors
  },
  font: {
    fontFamily: "'Roboto', 'Arial', 'sans-serif'",
    fontSize: '.9rem'
  }
};

// TODO Required module.exports and js for usage with gatsby-config
module.exports = {
  theme
};
