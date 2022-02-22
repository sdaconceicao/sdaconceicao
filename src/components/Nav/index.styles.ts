import { createUseStyles } from 'theme/createUseStylesWithTheme';

export default createUseStyles(({ maxWidth, palette, breakpoints }: ThemeProps) => ({
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
  listItemLink: {},
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
  list: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
    marginRight: '.5rem'
  },
  listItem: {
    margin: 5,
    padding: [0, 5],
    display: 'inline-block',
    textTransform: 'uppercase'
  },
  btnMenu: {
    display: 'none'
  },
  [breakpoints.small]: {
    btnMenu: {
      display: 'block',
      padding: '1rem',
      marginRight: '1rem',
      borderRadius: '5px',
      cursor: 'pointer'
    },
    list: {
      display: ({ open }: { open: boolean }) => (open ? 'block' : 'none'),
      width: '100%',
      top: 70,
      left: 0,
      height: 'calc(100vh - 70px)',
      position: 'absolute',
      backgroundColor: palette.white,
      padding: 0
    },
    listItem: {
      display: 'block',
      borderBottom: `1px solid ${palette.g400}`,
      margin: 0,
      padding: 0,
      '&:last-child': {
        borderBottom: 'none'
      }
    },
    listItemLink: {
      color: `${palette.text}!important`,
      width: '100%',
      display: 'block',
      padding: '1rem',
      '&:hover': {
        backgroundColor: palette.primary,
        color: `${palette.white}!important`
      }
    }
  }
}));
