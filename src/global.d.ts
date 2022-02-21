declare const __PATH_PREFIX__: string;

declare module '*.png' {
  const value: any;
  export default value;
}
declare interface ThemeProps {
  palette: Record<string, unknown>;
  maxWidth: number;
  breakpoints: Record<string>;
  font: Record<string, unknown>;
}
