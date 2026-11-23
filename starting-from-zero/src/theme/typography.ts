import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

/** Central typography tokens. */
export const fonts = {
  display: '"Bebas Neue", "Impact", sans-serif',
  body: '"Inter", "Helvetica Neue", Arial, sans-serif',
} as const;

let loaded = false;
/** Loads the bundled (OFL-licensed) fonts once. Safe to call from anywhere. */
export const ensureFonts = () => {
  if (loaded) return;
  loaded = true;
  loadFont({family: 'Bebas Neue', url: staticFile('fonts/bebas-neue-latin-400-normal.woff2'), weight: '400'});
  loadFont({family: 'Inter', url: staticFile('fonts/inter-latin-500-normal.woff2'), weight: '500'});
  loadFont({family: 'Inter', url: staticFile('fonts/inter-latin-700-normal.woff2'), weight: '700'});
  loadFont({family: 'Inter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
};

export const type = {
  // Big kinetic statements
  headline: {fontFamily: fonts.display, fontSize: 168, letterSpacing: 4, lineHeight: 0.92},
  headlineSmall: {fontFamily: fonts.display, fontSize: 118, letterSpacing: 3, lineHeight: 0.95},
  // Location / time stamps
  stamp: {fontFamily: fonts.body, fontSize: 30, fontWeight: 700, letterSpacing: 8},
  // Captions (large, readable on phones)
  caption: {fontFamily: fonts.body, fontSize: 58, fontWeight: 800, lineHeight: 1.18},
} as const;
