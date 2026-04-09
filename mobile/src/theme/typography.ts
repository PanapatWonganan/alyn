/**
 * Alyn Mobile App - Typography System
 *
 * Font family: Noto Sans Thai
 * Scale system with proper line heights for Thai language readability.
 */

export const typography = {
  // Font Family
  fontFamily: {
    regular: 'NotoSansThai_400Regular',
    medium: 'NotoSansThai_500Medium',
    semiBold: 'NotoSansThai_600SemiBold',
    bold: 'NotoSansThai_700Bold',
  },

  // Font Sizes with Line Heights
  fontSize: {
    xs: {
      size: 11,
      lineHeight: 16,
    },
    sm: {
      size: 13,
      lineHeight: 18,
    },
    base: {
      size: 15,
      lineHeight: 22,
    },
    md: {
      size: 17,
      lineHeight: 24,
    },
    lg: {
      size: 20,
      lineHeight: 28,
    },
    xl: {
      size: 24,
      lineHeight: 32,
    },
    '2xl': {
      size: 28,
      lineHeight: 36,
    },
    '3xl': {
      size: 34,
      lineHeight: 42,
    },
    '4xl': {
      size: 42,
      lineHeight: 50,
    },
  },

  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },

  // Letter Spacing (adjusted for Thai)
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },

  // Common Text Styles (pre-composed for convenience)
  heading: {
    h1: {
      fontFamily: 'NotoSansThai_700Bold',
      fontSize: 34,
      lineHeight: 42,
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: 'NotoSansThai_700Bold',
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: -0.5,
    },
    h3: {
      fontFamily: 'NotoSansThai_600SemiBold',
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: 0,
    },
    h4: {
      fontFamily: 'NotoSansThai_600SemiBold',
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: 0,
    },
    h5: {
      fontFamily: 'NotoSansThai_600SemiBold',
      fontSize: 17,
      lineHeight: 24,
      letterSpacing: 0,
    },
    h6: {
      fontFamily: 'NotoSansThai_600SemiBold',
      fontSize: 15,
      lineHeight: 22,
      letterSpacing: 0,
    },
  },

  body: {
    large: {
      fontFamily: 'NotoSansThai_400Regular',
      fontSize: 17,
      lineHeight: 24,
      letterSpacing: 0,
    },
    medium: {
      fontFamily: 'NotoSansThai_400Regular',
      fontSize: 15,
      lineHeight: 22,
      letterSpacing: 0,
    },
    small: {
      fontFamily: 'NotoSansThai_400Regular',
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0,
    },
  },

  // Reader-specific typography (optimized for long-form reading)
  reader: {
    title: {
      fontFamily: 'NotoSansThai_700Bold',
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: 0,
    },
    content: {
      fontFamily: 'NotoSansThai_400Regular',
      fontSize: 17,
      lineHeight: 28, // Extra line height for reading comfort
      letterSpacing: 0.2,
    },
  },

  // UI elements
  button: {
    fontFamily: 'NotoSansThai_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },

  caption: {
    fontFamily: 'NotoSansThai_400Regular',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0,
  },

  label: {
    fontFamily: 'NotoSansThai_500Medium',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
} as const;

export type Typography = typeof typography;
