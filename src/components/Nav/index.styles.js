import { createUseStyles } from '../../theme/createUseStylesWithTheme';

export default createUseStyles(({ palette }) => ({
  nav: {
    backgroundColor: palette.primaryBg,
    padding: 10
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0
  },
  listItem: {
    margin: 5,
    display: 'inline-block'
  }
}));
