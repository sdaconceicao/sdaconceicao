import { createUseStyles } from 'theme/createUseStylesWithTheme';

export default createUseStyles(({ palette }: ThemeProps) => ({
  link: {
    textDecoration: 'none',
    color: (dark: boolean) => (dark ? palette.linkLight : palette.link),
    fontWeight: 800,
    '&:hover': {
      textDecoration: 'underline'
    }
  }
}));
