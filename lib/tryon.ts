import type { JewelryCategory } from "./types";

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
