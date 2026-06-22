// small reusable motion primitives shared across scenes: an eased number
// counter and a stroke-drawn progress ring. brand tokens come from context;
// values are frame-driven, hence the inline style objects.

import React from 'react';
import { useCurrentFrame } from 'remotion';

import { useBrand, useFonts } from '../lib/context';
import { ease } from '../lib/anim';

export const Counter: React.FC<{
  to: number;
  from?: number;
  start: number;
  len: number;
  size: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  colour?: string;
}> = ({ to, from = 0, start, len, size, prefix = '', suffix = '', decimals = 0, colour }) => {
  const brand = useBrand();
  const { display } = useFonts();
  const frame = useCurrentFrame();
  const v = from + (to - from) * ease(frame, start, start + len);
  const shown = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-GB');
  return (
    <span
      style={{
        fontFamily: display,
        fontWeight: 660,
        fontSize: size,
        letterSpacing: '-0.03em',
        color: colour ?? brand.ink,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {prefix}
      {shown}
      {suffix}
    </span>
  );
};

export const Ring: React.FC<{
  size: number;
  progress: number;
  stroke: number;
  colour?: string;
}> = ({ size, progress, stroke, colour }) => {
  const brand = useBrand();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={brand.surfaceEdge} strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={colour ?? brand.ink}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(1, progress))}
      />
    </svg>
  );
};
