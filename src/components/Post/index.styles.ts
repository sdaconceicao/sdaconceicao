import { createUseStyles } from 'theme/createUseStylesWithTheme';

export default createUseStyles(({ palette }: ThemeProps) => ({
  post: {
    padding: [20, 20],
    display: 'flex',
    position: 'relative'
  },
  content: {
    color: palette.g600
  },
  title: {
    fontSize: '1.1rem'
  },
  featuredImage: { marginRight: '1rem' },
  date: { fontSize: '.8rem', display: 'block' },
  excerpt: { marginTop: '.5rem' },
  readMore: {
    position: 'absolute',
    bottom: 20,
    right: 20
  }
}));
