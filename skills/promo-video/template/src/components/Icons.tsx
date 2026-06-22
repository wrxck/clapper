// a small icon set keyed by name, rendered as hugeicons glyphs from the
// `hgi-stroke-rounded` webfont (the same icon font the app ships). no inline svg,
// no hand-drawn paths, no emoji. add a name to the schema's iconName enum and a
// matching codepoint here to extend the set.

import React from 'react';

import type { IconName } from '../schema';

// hugeicons stroke-rounded glyphs, by codepoint (extracted from the bundled font
// css - the woff2 in public/fonts is the same file the app ships). each name maps
// to a real glyph in the font.
const CODEPOINTS: Record<IconName, number> = {
  dumbbell: 0x3f9d,
  droplet: 0x3f99,
  analytics: 0x3b2f,
  restaurant: 0x460a,
  sparkles: 0x478e,
  viewOff: 0x4a01,
  cloud: 0x3e19,
  shield: 0x46e0,
  lock: 0x47c9,
  scale: 0x4a4d,
  timer: 0x4922,
  chart: 0x3d8e,
};

const glyph = (name: IconName): string => String.fromCharCode(CODEPOINTS[name]);

// strokeWidth is accepted for backwards-compatible call sites but has no effect
// on a font glyph (the stroke weight is baked into the typeface).
export const Icon: React.FC<{
  name: IconName;
  size: number;
  colour?: string;
  strokeWidth?: number;
}> = ({ name, size, colour = 'currentColor' }) => (
  <span
    style={{
      fontFamily: 'hgi-stroke-rounded',
      fontSize: size,
      lineHeight: 1,
      color: colour,
      display: 'block',
      flex: 'none',
    }}
  >
    {glyph(name)}
  </span>
);
