export const colors = {
  forest: '#174f36',
  green: '#26845b',
  moss: '#6f8f74',
  mint: '#dff3e8',
  cream: '#f7f3e8',
  paper: '#fffdf8',
  ink: '#183029',
  muted: '#697a73',
  line: '#dbe2dc',
  amber: '#c87a24',
  red: '#b43b36',
  blue: '#2f6f91',
  white: '#ffffff',
  overlay: 'rgba(11, 42, 29, 0.42)',
};

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 36 };
export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 };
export const motion = { fast: 140, normal: 240, slow: 420, easing: 'ease-in-out' };
export const touchTarget = 44;
export const focusRing = { borderWidth: 2, borderColor: colors.blue };
export const states = {
  offline: { background: '#fff1d6', foreground: '#6f4815' },
  permissionDenied: { background: '#fbe6e3', foreground: colors.red },
  success: { background: colors.mint, foreground: colors.forest },
};

export const typography = {
  display: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 40, letterSpacing: -0.7, maxWidth: 680 },
  title: { fontFamily: fonts.display, fontSize: 27, lineHeight: 33, letterSpacing: -0.35, maxWidth: 680 },
  heading: { fontFamily: fonts.display, fontSize: 21, lineHeight: 27, maxWidth: 680 },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, maxWidth: 720 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 21, maxWidth: 720 },
  label: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 17, letterSpacing: 0.2, maxWidth: 720 },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 16, maxWidth: 720 },
};

export const shadow = Platform.select({
  web: { boxShadow: '0 5px 24px rgba(16, 43, 32, 0.12)' },
  default: {
    shadowColor: '#102b20',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
});

export const shadowSoft = Platform.select({
  web: { boxShadow: '0 3px 16px rgba(16, 43, 32, 0.07)' },
  default: {
    shadowColor: '#102b20',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
});
import { Platform } from 'react-native';
