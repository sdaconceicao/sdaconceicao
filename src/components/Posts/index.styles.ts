import { createUseStyles } from 'theme/createUseStylesWithTheme';

export default createUseStyles(({ palette }: ThemeProps) => ({
  posts: {
    backgroundColor: palette.g100
  },
  heading: {
    padding: [20, 20, 0],
    fontSize: '1.25rem'
  },
  post: {
    borderBottom: `1px solid ${palette.g300}`,
    '&:last-child': {
      borderBottom: 'none'
    }
  }
}));
