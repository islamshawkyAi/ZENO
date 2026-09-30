export const ZENO = {
  colors: {
    bg: '#070914',
    bg2: '#0A0E1C',
    panel: '#0E1222',
    panel2: '#13182A',
    glass: 'rgba(255,255,255,0.055)',
    glassStrong: 'rgba(255,255,255,0.085)',
    text: '#F7F8FF',
    muted: '#9299B3',
    blue: '#4D7CFF',
    purple: '#A855F7',
    cyan: '#22D3EE',
    green: '#34D399',
    red: '#FB7185',
    gold: '#FBBF24',
    border: 'rgba(255,255,255,0.10)',
    borderBlue: 'rgba(77,124,255,0.32)',
  },
  radius: { sm: 12, md: 18, lg: 24, xl: 30, pill: 999 },
  space: { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, xxl: 32 },
  type: { xs: 11, sm: 13, md: 15, lg: 18, xl: 24, hero: 34 },
  shadows: { glow: { shadowColor: '#4D7CFF', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: {width: 0, height: 8}, elevation: 8 } },
};

export const gradients = {
  primary: [ZENO.colors.blue, ZENO.colors.purple] as const,
  cyan: [ZENO.colors.cyan, ZENO.colors.blue] as const,
  dark: [ZENO.colors.bg, '#17102C'] as const,
};
