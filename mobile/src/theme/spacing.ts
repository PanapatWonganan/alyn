/**
 * Alyn Mobile App - Spacing System
 *
 * Consistent spacing scale and border radius values.
 */

export const spacing = {
  // Spacing Scale
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
  '7xl': 96,

  // Screen padding (common edge insets)
  screen: {
    horizontal: 16,
    vertical: 20,
  },

  // Container max widths
  container: {
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
} as const;

export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;

// Border widths
export const borderWidth = {
  none: 0,
  thin: 1,
  medium: 2,
  thick: 3,
} as const;

// Icon sizes (for consistent icon sizing)
export const iconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  '2xl': 48,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type BorderWidth = typeof borderWidth;
export type IconSize = typeof iconSize;
