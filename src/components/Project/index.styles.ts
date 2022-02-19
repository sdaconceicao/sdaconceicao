import { createUseStyles } from 'theme/createUseStylesWithTheme';

export default createUseStyles(({ palette }: ThemeProps) => ({
  projects: {
    padding: 20,
    backgroundColor: palette.g300
  }
}));
