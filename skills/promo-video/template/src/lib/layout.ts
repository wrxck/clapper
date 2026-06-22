// aspect-aware sizing. every dimension in the film is expressed in `u` - a
// unit derived from the short edge - so the same scenes compose correctly at
// 16:9, 9:16, 1:1, 4:5 and any other format without per-format scene code.

import type React from 'react';
import { useVideoConfig } from 'remotion';

// safe insets as fractions of width/height. they reserve the platform chrome a
// given aspect ratio overlays on the video so captions and key headline content
// never sit under a status bar, an action rail or a caption strip. expressed as
// fractions (not px) so they scale with any resolution at that ratio.
export interface SafeInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// pick insets by aspect ratio. 9:16 vertical is the heaviest (tiktok/reels stack
// a status bar on top and a caption + action rail on the lower right); 4:5 is
// lighter; 1:1 and 16:9 only need a light breathing margin.
export const safeInsets = (width: number, height: number): SafeInsets => {
  const ratio = width / height;
  // 9:16 and taller (portrait-heavy).
  if (ratio <= 0.6) return { top: 0.1, bottom: 0.18, left: 0.04, right: 0.12 };
  // 4:5 portrait.
  if (ratio < 0.9) return { top: 0.07, bottom: 0.1, left: 0.05, right: 0.05 };
  // 1:1 square.
  if (ratio <= 1.1) return { top: 0.05, bottom: 0.06, left: 0.05, right: 0.05 };
  // 16:9 and wider.
  return { top: 0.05, bottom: 0.06, left: 0.05, right: 0.05 };
};

export interface Frame {
  w: number;
  h: number;
  u: (n: number) => number;
  portrait: boolean;
  square: boolean;
  // safe insets in px for this format's width/height.
  safe: { top: number; bottom: number; left: number; right: number };
}

export const useFrame = (): Frame => {
  const { width, height } = useVideoConfig();
  const short = Math.min(width, height);
  const f = safeInsets(width, height);
  return {
    w: width,
    h: height,
    u: (n: number) => (n * short) / 1080,
    portrait: height > width * 1.2,
    square: Math.abs(width - height) < width * 0.21,
    safe: {
      top: f.top * height,
      bottom: f.bottom * height,
      left: f.left * width,
      right: f.right * width,
    },
  };
};

// css padding that keeps a centred scene's content inside the safe box: the
// format's safe insets plus an extra breathing pad on each edge. reserve a touch
// more at the bottom so a pinned sound-off caption never overlaps the content.
export const safePadding = (
  frame: Frame,
  pad: number,
): Pick<React.CSSProperties, 'paddingTop' | 'paddingBottom' | 'paddingLeft' | 'paddingRight'> => ({
  paddingTop: frame.safe.top + pad,
  paddingBottom: frame.safe.bottom + pad + frame.u(40),
  paddingLeft: frame.safe.left + pad,
  paddingRight: frame.safe.right + pad,
});
