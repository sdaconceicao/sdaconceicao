import { createUseStyles } from 'theme/createUseStylesWithTheme';

export default createUseStyles(({ palette }: ThemeProps) => ({
  contact: {},
  listItem: {
    display: 'inline-block',
    padding: [10, 10, 0, 0]
  },
  link: {
    color: palette.g700
  }
}));
