import { createUseStyles } from 'theme/createUseStylesWithTheme';

export default createUseStyles(({ breakpoints, palette, maxWidth }: ThemeProps) => ({
  about: {
    width: '100%',
    backgroundColor: palette.primary,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40
  },
  avatar: {
    position: 'relative',
    width: 500,
    left: -37,
    marginRight: -450,
    bottom: 0,
    marginBottom: -5
  },
  avatarImage: {
    width: '100%'
  },
  content: {
    position: 'relative',
    maxWidth: maxWidth,
    width: '100%',
    height: 573,
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
    borderRadius: 26,
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
  social: {
    position: 'absolute',
    bottom: 20,
    left: 450,
    padding: 20,
    backgroundColor: palette.white,
    borderRadius: 26,
    '&::before': {
      content: '""',
      width: 0,
      height: 0,
      position: 'absolute',
      borderStyle: 'solid',
      borderWidth: [15, 40, 45, 0],
      borderColor: `transparent ${palette.white} transparent transparent`,
      left: -30
    }
  },
  followMe: {
    fontSize: '1.4rem'
  },
  socialButtons: {
    fontSize: 80
  },
  [breakpoints.large]: {
    avatar: {
      width: 450,
      left: 0,
      marginBottom: -3
    },
    content: {
      height: 500
    }
  },
  [breakpoints.medium]: {
    avatar: {
      width: 400
    },
    content: {
      height: 425
    },
    summary: {
      width: 'calc(50% - 50px)'
    },
    social: {
      left: 485,
      bottom: 10
    },
    socialButtons: {
      fontSize: 25
    },
    followMe: {
      fontSize: '1rem'
    }
  },
  [breakpoints.small]: {
    avatar: {
      display: 'none'
    },
    summary: {
      position: 'relative',
      top: 55,
      left: 20,
      width: 'calc(100% - 80px)',
      '&::before': {
        display: 'none'
      }
    },
    social: {
      position: 'relative',
      top: -20,
      left: 20,
      width: 'calc(100% - 80px)',
      '&::before': {
        display: 'none'
      }
    },
    content: {
      height: 600
    }
  }
}));
