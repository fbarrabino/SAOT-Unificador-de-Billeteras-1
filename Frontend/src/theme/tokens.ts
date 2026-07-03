export const colors = {
  bg: '#000000',
  surface: '#0E1116',
  surface2: '#161A22',
  cardBorder: 'rgba(255,255,255,0.08)',
  hairline: 'rgba(255,255,255,0.07)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.60)',
  dim: 'rgba(255,255,255,0.40)',
  faint: 'rgba(255,255,255,0.22)',
  cyan: '#39C3F2',
  cyanDeep: '#22A4D9',
  teal: '#6FE0D6',
  lime: '#B6F04B',
  green: '#4ADE80',
  violet: '#9B6BFF',
  red: '#F87171',
  ctaText: '#06121A',
};

export const gradients = {
  cyan: ['#39C3F2', '#6FE0D6'] as const,
  lime: ['#B6F04B', '#6FE0D6'] as const,
  mix: ['#39C3F2', '#9B6BFF', '#B6F04B'] as const,
  mpTint: ['rgba(57,195,242,0.16)', 'rgba(255,255,255,0.02)'] as const,
  uaTint: ['rgba(155,107,255,0.16)', 'rgba(255,255,255,0.02)'] as const,
  lmTint: ['rgba(182,240,75,0.16)', 'rgba(255,255,255,0.02)'] as const,
  bbTint: ['rgba(104,66,255,0.18)', 'rgba(255,255,255,0.02)'] as const, // Brubank
  nxTint: ['rgba(255,92,0,0.18)',   'rgba(255,255,255,0.02)'] as const, // Naranja X
};

export const radii = {
  card: 20,
  cardLg: 24,
  button: 14,
  pill: 999,
  input: 13,
  icon: 14,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  screenH: 18,
};

export const fonts = {
  display: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemi: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
  bodyExtra: 'PlusJakartaSans_800ExtraBold',
};

export const type = {
  screenTitle: { fontFamily: fonts.display, fontSize: 26, letterSpacing: -0.4, color: colors.text },
  display: { fontFamily: fonts.displayBold, fontSize: 28, letterSpacing: -0.5, color: colors.text },
  balance: { fontFamily: fonts.displayBold, fontSize: 38, letterSpacing: -0.4, color: colors.text },
  h4: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 14.5, color: colors.muted },
  bodyText: { fontFamily: fonts.body, fontSize: 15, color: colors.text },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: colors.muted,
  },
  button: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.ctaText, letterSpacing: -0.2 },
  link: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.cyan },
  small: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
};

export const shadow = {
  cta: {
    shadowColor: '#39C3F2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 8,
  },
};
