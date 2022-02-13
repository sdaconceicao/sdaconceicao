import { createUseStyles } from '../../theme/createUseStylesWithTheme';

export default createUseStyles(({ palette }) => ({
  link: {
    textDecoration: 'none',
    color: (dark) => (dark ? palette.linkLight : palette.link),
    fontWeight: 800,
    '&:hover': {
      textDecoration: 'underline'
    }
  }
}));
