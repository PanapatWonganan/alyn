/**
 * Alyn Mobile App - Unified Theme System
 *
 * Premium Thai novel reading platform theme.
 * Exports a complete theme object with colors, typography, spacing, and shadows.
 */

import { colors, type Colors } from './colors';
import { typography, type Typography } from './typography';
import { spacing, borderRadius, borderWidth, iconSize, type Spacing, type BorderRadius, type BorderWidth, type IconSize } from './spacing';
import { shadows, type Shadows } from './shadows';

/**
 * Complete theme object
 */
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  borderWidth,
  iconSize,
  shadows,
} as const;

/**
 * Theme type
 */
export type Theme = {
  colors: Colors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  borderWidth: BorderWidth;
  iconSize: IconSize;
  shadows: Shadows;
};

/**
 * Export individual modules for tree-shaking
 */
export { colors } from './colors';
export type { Colors } from './colors';

export { typography } from './typography';
export type { Typography } from './typography';

export { spacing, borderRadius, borderWidth, iconSize } from './spacing';
export type { Spacing, BorderRadius, BorderWidth, IconSize } from './spacing';

export { shadows } from './shadows';
export type { Shadows } from './shadows';

/**
 * Default export
 */
export default theme;
