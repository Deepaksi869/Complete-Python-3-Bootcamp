/**
 * PROTAGONIST DESIGN TOKENS
 * ---------------------------------------------------------------
 * This is the single source of truth for how the protagonist looks.
 * Change a value here and the character updates in every scene of
 * every episode.
 *
 * When a reference photo is supplied (public/assets/character-reference/),
 * these tokens are what get tuned to match it: skin tone, hair shape,
 * beard density, face proportions and clothing.
 */
export const characterDesign = {
  skin: '#a8724f',
  skinShadow: '#80523a',
  skinHighlight: '#c48d67',
  lips: '#7a4635',
  hair: '#17120f',
  hairHighlight: '#3a2e27',
  beard: '#241a15',
  eyes: '#1a110c',
  sclera: '#efe6dc',
  brows: '#140f0c',

  // Wardrobe: beige overshirt, dark tee, indigo jeans, off-white sneakers.
  overshirt: '#c9b48f',
  overshirtShadow: '#9e8a69',
  tee: '#1f2633',
  jeans: '#2c3d5e',
  jeansShadow: '#1f2c45',
  shoes: '#e7e1d5',
  soles: '#b9b1a3',
  watch: '#2a2a2a',

  // Proportions (character is 360 units tall, feet at y = 0)
  height: 360,
  hipY: -178,
  torsoLength: 112,
  thigh: 90,
  shin: 86,
  upperArm: 66,
  forearm: 58,
  headScale: 0.8,

  // Face shape (head-local units, before headScale)
  headHalfWidth: 25,
  headHalfDepth: 28,
  noseLength: 6.5,
  beardFullness: 1, // 0 = stubble, 1 = full short beard
  hairVolume: 1, // 0 = close crop, 1 = textured quiff
} as const;

export type CharacterDesign = typeof characterDesign;
