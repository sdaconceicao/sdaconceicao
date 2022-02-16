import { createUseStyles } from '../../theme/createUseStylesWithTheme';

export default createUseStyles(({ palette }) => ({
  contact: {},
  listItem: {
    display: 'inline-block',
    padding: [0, 10]
  },
  link: {
    fontSize: 80,
    color: palette.g700
  }
}));