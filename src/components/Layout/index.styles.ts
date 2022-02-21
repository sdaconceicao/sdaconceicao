import { createUseStyles } from 'theme/createUseStylesWithTheme';

export default createUseStyles(({ font, maxWidth, palette }: ThemeProps) => ({
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
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: maxWidth,
    borderLeft: `1px solid ${palette.g300}`,
    borderRight: `1px solid ${palette.g300}`
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerContent: {
    textAlign: 'center',
    width: '100%',
    maxWidth: maxWidth,
    backgroundColor: palette.g500
  },
  designed: {
    fontStyle: 'italic',
    padding: 10
  },
  copyright: {
    padding: [0, 10, 10, 10]
  }
}));
