import { createUseStyles } from '../../theme/createUseStylesWithTheme';

export default createUseStyles(({ font, maxWidth }) => ({
  '@global': {
    body: {
      fontFamily: font.fontFamily,
      boxSizing: 'border-box'
    }
  },
  header: {
    margin: 0
  },
  main: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    maxWidth: maxWidth,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
}));
