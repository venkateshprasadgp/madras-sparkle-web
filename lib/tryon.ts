import type { JewelryCategory } from "./types";

const NECK_FIT =
  "Fit it exactly the way a real necklace is worn: the chain wraps around the back of the neck, so on each side it emerges from behind the neck at the base of the neck, then curves smoothly down over the collarbones following the body's contours in a soft U or V shape, and both sides meet at the centre of the chest. The centrepiece or pendant hangs straight down with gravity, centred below the hollow of the throat and aligned with the middle of the body. Never draw the chain as straight lines, never let it float over the face, chin or clothing as a flat sticker, and keep it symmetrical about the centre of the neck. Scale it to real-world size relative to the person's neck and shoulders. Where a saree, dupatta or neckline covers part of the neck or shoulder, the chain passes over or under the fabric exactly as a real necklace would, with correct occlusion and contact shadows.";

const FIT: Record<JewelryCategory, string> = {
  NECKLACE: `${NECK_FIT} This is a necklace: it sits close to the neck, resting on the collarbones and upper chest.`,
  PENDANT: `${NECK_FIT} This is a pendant on a fine chain: the chain is thin and delicate and the pendant rests on the upper chest a few centimetres below the throat hollow.`,
  HARAM: `${NECK_FIT} This is a long haram: it hangs well below the collarbones, draping over the clothing down to the upper stomach, following the curve of the chest.`,
  EARRINGS_JUMMIKI:
    "Place one earring on each earlobe, matched as a mirror-image pair, hanging straight down with gravity, scaled to real-world size relative to the ear, with hair overlapping them naturally where it falls over the ears.",
  BANGLES_BRACELET:
    "Place it around the person's wrist, wrapping around the arm in correct perspective with the far side hidden behind the wrist, scaled to fit the wrist snugly.",
  RINGS: "Place it on the person's ring finger, wrapping around the finger in correct perspective, scaled to the finger.",
  NOSE_PINS: "Place it on the side of the person's nostril, small and scaled to real-world size.",
};

export function blendPrompt(category: JewelryCategory, closeUp = false) {
  const view = closeUp
    ? "The first image is a close-up crop of a photograph of a person"
    : "The first image is a photograph of a person";
  return [
    `${view}; the second image is a gold/diamond jewelry piece on a transparent background. Edit the first image so the person is wearing this exact piece.`,
    FIT[category],
    "Match the room lighting and colour temperature, add realistic soft contact shadows on skin and fabric, and natural reflections on the metal and stones.",
    "Reproduce the jewelry design faithfully. Keep the person's face, identity, skin, pose, clothing, any jewelry they already wear, the framing and the background unchanged. Return only the edited photograph with the same framing.",
  ].join(" ");
}
