/**
 * Alyn Mobile App - Shadow System
 *
 * Rosegold-tinted shadow presets for cards and elevated surfaces.
 * Designed to complement the warm, feminine brand aesthetic.
 */

export const shadows = {
  // Card shadows (rosegold-tinted)
  sm: {
    shadowColor: '#9D5E55', // rosegold dark
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },

  md: {
    shadowColor: '#9D5E55', // rosegold dark
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  lg: {
    shadowColor: '#9D5E55', // rosegold dark
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },

  xl: {
    shadowColor: '#9D5E55', // rosegold dark
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  // Neutral shadows (for elements that need less warmth)
  neutral: {
    sm: {
      shadowColor: '#2D1B18', // brand black
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#2D1B18', // brand black
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#2D1B18', // brand black
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 5,
    },
  },

  // Inner shadow effect (for pressed states)
  inner: {
    shadowColor: '#9D5E55',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 0, // No elevation for inner shadows
  },

  // Modal/Dialog shadows (more prominent)
  modal: {
    shadowColor: '#2D1B18',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  // No shadow (for flat surfaces)
  none: {
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

export type Shadows = typeof shadows;
