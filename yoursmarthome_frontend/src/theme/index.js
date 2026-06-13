export const Colors = {
  // — Backgrounds & Surfaces — nero neutro, zero blu
  background:  '#0A0A0A',
  surface:     '#111111',
  card:        '#191919',
  cardAlt:     '#202020',

  // — Accents — giallo pastello
  accent:      '#D9D08A',
  accentGlow:  '#E4DC9E',
  accentSoft:  '#1E1C0C',

  // — Status — pastello caldo con bg colorato
  success:     '#7DC98A',
  successSoft: '#2A3D2E',
  warning:     '#C9963A',
  warningSoft: '#3D2E1A',
  danger:      '#C97070',
  dangerSoft:  '#3D1E1E',
  purple:      '#8B80C9',
  purpleSoft:  '#221E3D',

  // — Typography —
  textPrimary:   '#EAEAEA',
  textSecondary: '#737373',
  textMuted:     '#383838',

  // — Borders —
  border:      '#222222',
  borderLight: '#2D2D2D',

  // — Misc —
  overlay:     'rgba(0,0,0,0.65)',
  white:       '#FFFFFF',
  navBar:      '#080808',
};

export const Typography = {
  heading1: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  heading2: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.3 },
  heading3: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400', color: Colors.textSecondary, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  caption: { fontSize: 12, fontWeight: '500', color: Colors.textMuted, letterSpacing: 0.3 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.5 },
  temperature: { fontSize: 42, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -1 },
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const Radius = {
  sm: 8, md: 14, lg: 18, xl: 24, xxl: 32, full: 100,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  accent: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: {
    shadowColor: Colors.accentGlow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
};
