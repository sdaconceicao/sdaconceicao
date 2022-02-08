import { createUseStyles } from '../../theme/createUseStylesWithTheme';

export default createUseStyles(({ maxWidth, palette }) => ({
  nav: {
    backgroundColor: palette.primaryBg,
    padding: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    maxWidth: maxWidth,
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {},
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    justifyContent: 'flex-start',
    flexDirection: 'row'
  },
  listItem: {
    margin: 5,
    display: 'inline-block'
  }
}));
