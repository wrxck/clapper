// the film's typography: word-staggered kinetic headlines (rise + de-blur +
// settle) and quieter supporting lines. brand tokens come from context. style
// objects are computed per frame (remotion animates through the style
// attribute), so they live in factory functions rather than a stylesheet.

import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

import { useBrand, useFonts } from '../lib/context';
import { settle } from '../lib/anim';

const headlineWrap = (
  font: string,
  size: number,
  colour: string,
  weight: number,
): React.CSSProperties => ({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  columnGap: size * 0.26,
  rowGap: size * 0.06,
  fontFamily: font,
  fontSize: size,
  fontWeight: weight,
  letterSpacing: '-0.035em',
  lineHeight: 1.04,
  color: colour,
  textAlign: 'center',
});

const wordStyle = (p: number, size: number): React.CSSProperties => ({
  display: 'inline-block',
  opacity: p,
  transform: `translateY(${(1 - p) * size * 0.55}px)`,
  filter: p < 0.98 ? `blur(${(1 - p) * 14}px)` : undefined,
});

export const Kinetic: React.FC<{
  words: readonly string[];
  size: number;
  delay?: number;
  stagger?: number;
  colour?: string;
  weight?: number;
}> = ({ words, size, delay = 0, stagger = 5, colour, weight = 640 }) => {
  const brand = useBrand();
  const { display } = useFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={headlineWrap(display, size, colour ?? brand.ink, weight)}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} style={wordStyle(settle(frame, fps, delay + i * stagger), size)}>
          {w}
        </span>
      ))}
    </div>
  );
};

const subStyle = (
  font: string,
  p: number,
  size: number,
  colour: string,
): React.CSSProperties => ({
  fontFamily: font,
  fontSize: size,
  fontWeight: 460,
  letterSpacing: '-0.01em',
  color: colour,
  textAlign: 'center',
  opacity: p,
  transform: `translateY(${(1 - p) * size * 0.5}px)`,
});

export const Sub: React.FC<{
  text: string;
  size: number;
  delay?: number;
  colour?: string;
}> = ({ text, size, delay = 0, colour }) => {
  const brand = useBrand();
  const { text: textFont } = useFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <div style={subStyle(textFont, settle(frame, fps, delay), size, colour ?? brand.inkMuted)}>{text}</div>;
};
