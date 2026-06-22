// aspect-aware sizing. every dimension in the film is expressed in `u` - a
// unit derived from the short edge - so the same scenes compose correctly at
// 16:9, 9:16, 1:1, 4:5 and any other format without per-format scene code.

import { useVideoConfig } from 'remotion';

export interface Frame {
  w: number;
  h: number;
  u: (n: number) => number;
  portrait: boolean;
  square: boolean;
}

export const useFrame = (): Frame => {
  const { width, height } = useVideoConfig();
  const short = Math.min(width, height);
  return {
    w: width,
    h: height,
    u: (n: number) => (n * short) / 1080,
    portrait: height > width * 1.2,
    square: Math.abs(width - height) < width * 0.21,
  };
};
