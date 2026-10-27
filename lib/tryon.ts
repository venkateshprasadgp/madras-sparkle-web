import type { JewelryCategory } from "./types";

export interface Placement {
  y: number;
  width: number;
}

/** Default overlay position (relative to photo height) and width (relative to photo width). */
export const DEFAULT_PLACEMENT: Record<JewelryCategory, Placement> = {
  NECKLACE: { y: 0.62, width: 0.45 },
  HARAM: { y: 0.7, width: 0.5 },
  PENDANT: { y: 0.62, width: 0.4 },
  EARRINGS_JUMMIKI: { y: 0.42, width: 0.38 },
  BANGLES_BRACELET: { y: 0.8, width: 0.3 },
  RINGS: { y: 0.8, width: 0.12 },
  NOSE_PINS: { y: 0.4, width: 0.05 },
};

const NECK_PROMPT =
  "Synthesize this gold/diamond jewelry piece seamlessly onto the person's neck and collarbone in the photo. Match ambient room lighting, generate realistic soft skin shadows, and tuck chain edges naturally under clothing necklines.";

const BODY_PART: Partial<Record<JewelryCategory, string>> = {
  EARRINGS_JUMMIKI: "both earlobes, hanging naturally with gravity",
  BANGLES_BRACELET: "the person's wrist",
  RINGS: "the person's ring finger",
  NOSE_PINS: "the person's nostril",
};

export function blendPrompt(category: JewelryCategory) {
  const part = BODY_PART[category];
  const base = part
    ? `Synthesize this gold/diamond jewelry piece seamlessly onto ${part} in the photo. Match ambient room lighting, generate realistic soft skin shadows and natural reflections on the metal and stones.`
    : NECK_PROMPT;
  return `${base} The first image is the person's photograph; the second image is the jewelry piece with a transparent background. Keep the person's face, identity, pose, clothing and background unchanged. Reproduce the jewelry design faithfully. Return only the edited photograph.`;
}
