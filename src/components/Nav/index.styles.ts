import { createUseStyles } from '../../theme/createUseStylesWithTheme';

export default createUseStyles(({ maxWidth, palette }) => ({
  nav: {
    backgroundColor: palette.primaryBg,
    padding: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'fixed',
    width: '100%',
    zIndex: 5
  },
  content: {
    maxWidth: maxWidth,
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    textTransform: 'uppercase'
  },
  link: {
    color: `${palette.g600}!important`
  },
  list: {
    justifyContent: 'flex-start',
    flexDirection: 'row'
  },
  listItem: {
    margin: 5,
    padding: [0, 5],
    display: 'inline-block',
    textTransform: 'uppercase'
  }
}));