// Design tokens for lifeOnLine — green · blue · white (light mode)
export const COLORS = {
  // Primary palette – teal-green
  primary: '#0D9488',        // teal-600
  primaryDark: '#0F766E',    // teal-700
  primaryLight: '#2DD4BF',   // teal-400

  // Secondary accent – blue
  accent: '#1D4ED8',         // blue-700
  accentLight: '#3B82F6',    // blue-500
  accentSurface: '#EFF6FF',  // blue-50

  // Emergency red
  danger: '#DC2626',
  dangerDark: '#B91C1C',
  dangerLight: '#FCA5A5',

  // Severity colors
  severityLow: '#16A34A',    // green-600
  severityMedium: '#D97706', // amber-600
  severityHigh: '#DC2626',   // red-600

  // Neutrals – light mode
  background: '#F1F5F9',     // slate-100 (a little greyish)
  surface: '#FFFFFF',
  surfaceLight: '#E2E8F0',   // slate-200
  border: '#CBD5E1',         // slate-300

  // Text
  textPrimary: '#0F172A',    // slate-900
  textSecondary: '#475569',  // slate-600
  textMuted: '#94A3B8',      // slate-400

  // Status
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#1D4ED8',
};

export const FONTS = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  danger: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 10,
  },
};
