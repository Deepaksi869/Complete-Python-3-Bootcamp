/**
 * Shared character lighting presets, so the protagonist is lit the same way
 * every time he appears in the same environment.
 */
import {palette} from './palette';

export const lighting = {
  /** UAE apartment at night, lit by the laptop. */
  apartmentNight: {
    shade: 0.38,
    light: {color: palette.blue, strength: 0.24, from: 'front' as const},
    rim: {color: '#8fb0ff', strength: 0.3, from: 'back' as const},
  },
  /** UAE apartment at night with the warm desk lamp on. */
  apartmentLamp: {
    shade: 0.3,
    light: {color: palette.amber, strength: 0.28, from: 'front' as const},
    rim: {color: '#8fb0ff', strength: 0.28, from: 'back' as const},
  },
};
