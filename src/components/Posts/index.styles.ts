import { createUseStyles } from 'theme/createUseStylesWithTheme';

export default createUseStyles(({ palette }: ThemeProps) => ({
  posts: {
    width: '100%',
    height: 500,
    backgroundColor: palette.g100
  }
}));
