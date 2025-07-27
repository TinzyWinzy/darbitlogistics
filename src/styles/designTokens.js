// Design tokens for consistent styling across the application
export const colors = {
  primary: '#1F2120',
  secondary: '#EBD3AD',
  accent: '#FF6600',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  black: '#000000',
  gray: {
    100: '#f8f9fa',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#6c757d',
    700: '#495057',
    800: '#343a40',
    900: '#212529'
  }
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '3rem',
  xxl: '4rem'
};

export const borderRadius = {
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px'
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
};

export const typography = {
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem'
  },
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  }
};

export const breakpoints = {
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1400px'
};

export const transitions = {
  fast: '0.15s ease-in-out',
  normal: '0.3s ease-in-out',
  slow: '0.5s ease-in-out'
};

// CSS custom properties for use in CSS files
export const cssVariables = {
  '--primary': colors.primary,
  '--secondary': colors.secondary,
  '--accent': colors.accent,
  '--success': colors.success,
  '--warning': colors.warning,
  '--danger': colors.danger,
  '--info': colors.info,
  '--light': colors.light,
  '--dark': colors.dark,
  '--white': colors.white,
  '--black': colors.black,
  '--radius': borderRadius.md,
  '--shadow-sm': shadows.sm,
  '--shadow-md': shadows.md,
  '--shadow-lg': shadows.lg,
  '--transition': transitions.normal
}; 