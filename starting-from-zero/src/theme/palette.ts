/**
 * Central colour palette for the whole series.
 * Every scene, prop and UI pulls colours from here so the look stays consistent.
 */
export const palette = {
  // Core art direction
  navy950: '#050a16',
  navy900: '#081127',
  navy800: '#0d1a36',
  navy700: '#14254a',
  navy600: '#1d3461',
  navy500: '#2a4677',
  orange: '#f28a3c',
  orangeDeep: '#d9641f',
  orangeSoft: '#ffb27a',
  amber: '#ffc978',
  beige: '#d8c6a6',
  beigeLight: '#ece0c8',
  beigeDark: '#a8957a',
  blue: '#7fb4ff',
  blueSoft: '#a9cbff',
  blueGlow: '#5f9dff',
  cyan: '#7fe3ff',

  // Neutrals
  white: '#f6f1e8',
  ink: '#0b0f18',
  grey: '#8a93a6',
  greyDark: '#3a4256',

  // Status / UI accents (muted, never neon)
  success: '#6fcf97',
  danger: '#e86f5c',
} as const;

export type PaletteKey = keyof typeof palette;

/** Sky gradients used by environments. */
export const skies = {
  night: ['#030714', '#0a1430', '#16264d', '#2b3c6b'],
  dusk: ['#0b1533', '#2b2e5c', '#7a4a6b', '#e0825a'],
  sunrise: ['#0e1a3c', '#3b3f6e', '#c9705a', '#f6a96a', '#ffe2b0'],
  goldenHour: ['#2a3a6a', '#7f6c8a', '#e29a68', '#ffd39a'],
  indiaDay: ['#f2d7a8', '#f6c98c', '#f3b37a'],
} as const;
