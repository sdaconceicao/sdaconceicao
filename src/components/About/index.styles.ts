import { createUseStyles } from '../../theme/createUseStylesWithTheme';

export default createUseStyles(({ palette, maxWidth }) => ({
  about: {
    width: '100%',
    backgroundColor: palette.primary,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40
  },
  content: {
    position: 'relative',
    maxWidth: maxWidth,
    width: '100%',
    height: 500,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  intro: {
    fontSize: 30
  },
  summary: {
    position: 'absolute',
    display: 'inline-block',
    backgroundColor: palette.white,
    width: 'calc(100% - 400px)',
    height: '50%',
    right: 20,
    top: 10,
    padding: 20,
    '&::before': {
      content: '""',
      width: 0,
      height: 0,
      position: 'absolute',
      borderLeft: `24px solid ${palette.white}`,
      borderRight: '12px solid transparent',
      borderTop: `12px solid ${palette.white}`,
      borderBottom: '20px solid transparent',
      bottom: -30
    }
  },
  description: {
    marginTop: 10
  },
  contact: {
    position: 'absolute',
    bottom: 30,
    right: 30
  }
}));
