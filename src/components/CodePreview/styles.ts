import { createUseStyles } from 'theme/createUseStylesWithTheme';

export default createUseStyles(({ palette }: ThemeProps) => ({
  codePreview: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr'
  },
  code: {
    backgroundColor: palette.g300,
    padding: '1rem'
  },
  preview: {
    border: `1px solid ${palette.g300}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
}));
