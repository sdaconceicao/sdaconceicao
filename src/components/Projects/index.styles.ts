import { createUseStyles } from 'theme/createUseStylesWithTheme';

export default createUseStyles(({ palette }: ThemeProps) => ({
  projects: {
    backgroundColor: palette.g300,
    padding: 20
  },
  heading: {
    fontSize: '1.25rem'
  }
}));
