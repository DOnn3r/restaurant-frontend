import { createTheme } from '@mui/material/styles';

export const colors = {
  green: '#35604A',      // vert empire mat
  greenDark: '#264636',
  greenSoft: '#E3EBE6',
  black: '#111111',
  white: '#FFFFFF',
  cassis: '#6B2D5C',     // touche violet cassis
  cassisSoft: '#F2E7EF',
  line: '#DADFDB',
  bg: '#F5F6F4',
  muted: '#515651',
};

const display = "'Fraunces Variable', Georgia, serif";

const theme = createTheme({
  palette: {
    primary: { main: colors.green, dark: colors.greenDark, light: '#5F8A73', contrastText: '#fff' },
    secondary: { main: colors.cassis, contrastText: '#fff' },
    background: { default: colors.bg, paper: colors.white },
    text: { primary: '#141414', secondary: colors.muted },
    divider: colors.line,
    error: { main: '#B3261E' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "'Manrope Variable', system-ui, sans-serif",
    h1: { fontFamily: display, fontWeight: 600, letterSpacing: '-0.01em' },
    h2: { fontFamily: display, fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontFamily: display, fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontFamily: display, fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.9rem' },
    h5: { fontFamily: display, fontWeight: 600, fontSize: '1.4rem' },
    h6: { fontWeight: 800, fontSize: '1.05rem' },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'a': { color: 'inherit' },
        ':focus-visible': { outline: `3px solid ${colors.cassis}`, outlineOffset: 2 },
        '@media (prefers-reduced-motion: reduce)': { '*': { animationDuration: '0.01ms !important', transitionDuration: '0.01ms !important' } },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 44, borderRadius: 8 } },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderRadius: 12, borderColor: colors.line } },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 6, fontWeight: 700 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 14 } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 800, color: colors.muted } } },
  },
});

export default theme;
