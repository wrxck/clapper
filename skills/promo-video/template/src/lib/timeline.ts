// turn the ordered scenes (each with a dursec) into frame spans on one
// timeline. shared by the film (to place each sequence) and root (to size each
// composition's durationinframes), so the two never disagree.

import type { Scene } from '../schema';

export interface Span {
  from: number;
  dur: number;
}

export const sceneFrames = (scenes: readonly Scene[], fps: number): Span[] => {
  let cursor = 0;
  return scenes.map((s) => {
    const dur = Math.max(1, Math.round(s.durSec * fps));
    const span = { from: cursor, dur };
    cursor += dur;
    return span;
  });
};

export const totalFrames = (scenes: readonly Scene[], fps: number): number =>
  sceneFrames(scenes, fps).reduce((n, s) => Math.max(n, s.from + s.dur), 1);
