// shared motion vocabulary - one easing family so every scene moves the same
// way (the feel: fast in, long settle, nothing linear).

import { Easing, interpolate, spring } from 'remotion';

export const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);

export const ease = (
  frame: number,
  from: number,
  to: number,
  outFrom = 0,
  outTo = 1,
): number =>
  interpolate(frame, [from, to], [outFrom, outTo], {
    easing: EXPO_OUT,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

// a soft, slightly underdamped pop used for cards and counters.
export const pop = (frame: number, fps: number, delay = 0): number =>
  spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120, mass: 0.9 } });

// a fully damped settle for big typography (no bounce, long tail).
export const settle = (frame: number, fps: number, delay = 0): number =>
  spring({ frame: frame - delay, fps, config: { damping: 200, stiffness: 80 } });

// scene exit: fade + drift + blur over the final `len` frames.
export const exitProgress = (frame: number, durationInFrames: number, len = 12): number =>
  interpolate(frame, [durationInFrames - len, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
