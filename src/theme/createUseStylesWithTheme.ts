import { useTheme, createUseStyles as originalUseStyles, DefaultTheme } from 'react-jss';

/**
 * Return method to create classes with theme included in props
 * @param generateStylesFn
 * @returns classes obj
 */
export const createUseStyles =
  (generateStylesFn: (styles: ThemeProps) => Record<string, string | DefaultTheme>) =>
  <P>(props?: P) => {
    const theme = useTheme<DefaultTheme>();
    return originalUseStyles(generateStylesFn)({ ...theme, ...props });
  };
