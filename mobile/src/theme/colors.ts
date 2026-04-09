/**
 * Alyn Mobile App - Color System
 *
 * Brand colors for the premium Thai novel reading platform.
 * Feminine, warm, dreamy aesthetic with rosegold primary palette.
 */

export const colors = {
  // Brand Colors
  brand: {
    rosegold: '#CB8A7C',
    rosegoldDark: '#9D5E55',
    rosegoldLight: '#D9A99E',
    cream: '#FFF4F1',
    creamDark: '#F5E6E1',
    black: '#2D1B18',
    white: '#FFFFFF',
  },

  // Coin/Payment UI
  coin: {
    primary: '#D4A034',
    light: '#F5E6C8',
  },

  // Semantic Colors
  background: '#FFF4F1', // cream
  foreground: '#2D1B18', // brand black

  primary: {
    DEFAULT: '#CB8A7C',
    dark: '#9D5E55',
    light: '#D9A99E',
    foreground: '#FFFFFF',
  },

  secondary: {
    DEFAULT: '#FFF4F1',
    dark: '#F5E6E1',
    foreground: '#2D1B18',
  },

  muted: {
    DEFAULT: '#F5F0EE',
    foreground: '#8A7570',
  },

  border: '#E8DDD9',

  // Status Colors
  success: {
    DEFAULT: '#4CAF50',
    light: '#E8F5E9',
    dark: '#388E3C',
  },

  error: {
    DEFAULT: '#F44336',
    light: '#FFEBEE',
    dark: '#D32F2F',
  },

  warning: {
    DEFAULT: '#FF9800',
    light: '#FFF3E0',
    dark: '#F57C00',
  },

  info: {
    DEFAULT: '#2196F3',
    light: '#E3F2FD',
    dark: '#1976D2',
  },

  // Reader Themes
  reader: {
    default: {
      background: '#FFFFFF',
      foreground: '#2D1B18',
    },
    sepia: {
      background: '#F4ECD8',
      foreground: '#5B4636',
    },
    night: {
      background: '#1A1A2E',
      foreground: '#C8C8D0',
    },
    dark: {
      background: '#121212',
      foreground: '#B0B0B0',
    },
  },

  // Overlay & Transparency
  overlay: {
    light: 'rgba(255, 244, 241, 0.95)', // cream with opacity
    dark: 'rgba(45, 27, 24, 0.8)', // brand black with opacity
    black: 'rgba(0, 0, 0, 0.5)',
  },

  // Component-specific
  card: {
    background: '#FFFFFF',
    border: '#E8DDD9',
  },

  input: {
    background: '#FFFFFF',
    border: '#E8DDD9',
    placeholder: '#8A7570',
  },

  // Text hierarchy
  text: {
    primary: '#2D1B18',
    secondary: '#8A7570',
    tertiary: '#B8ABA7',
    inverse: '#FFFFFF',
  },
} as const;

export type Colors = typeof colors;
