/**
 * Instagram Reels safe areas for a 1080x1920 frame.
 * Based on Meta's guidance: keep text out of the top ~14%, bottom ~35%
 * and away from the right-hand action buttons.
 */
export const FRAME = {width: 1080, height: 1920} as const;

export const SAFE = {
  top: 270,
  bottom: 1250, // nothing important below this line (IG caption + buttons)
  left: 90,
  right: 990, // avoid the like/comment/share column
} as const;

/** Vertical anchors used by the typography system. */
export const ANCHORS = {
  headlineCenterY: 640,
  captionBottomY: 1215,
  stampY: 300,
} as const;
