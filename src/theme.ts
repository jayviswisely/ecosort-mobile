export const colors = {
  background: '#F3F6F4',
  surface: '#FFFFFF',
  surfaceSoft: '#EAF2ED',
  text: '#142119',
  textSecondary: '#66736A',
  textTertiary: '#8B978F',
  primary: '#246B43',
  primaryDark: '#164E31',
  primarySoft: '#DDEEE4',
  normal: '#2F855A',
  normalSoft: '#E3F3E9',
  warning: '#C96A12',
  warningSoft: '#FFF1DE',
  danger: '#C83D3D',
  dangerSoft: '#FCE7E7',
  offline: '#727D76',
  offlineSoft: '#ECEFED',
  border: '#DCE4DE',
  divider: '#E7ECE8',
  black: '#0C1710',
  white: '#FFFFFF',
} as const;

export const radii = {
  small: 10,
  medium: 16,
  large: 22,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#10271A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
} as const;

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
} as const;
