import { createUseStyles } from '../../theme/createUseStylesWithTheme';

export default createUseStyles(({ palette }) => ({
  about: {
    width: '100%',
    height: 500,
    backgroundColor: palette.primary,
    position: 'relative'
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
  contact: {
    position: 'absolute',
    bottom: 30,
    right: 30
  }
}));
