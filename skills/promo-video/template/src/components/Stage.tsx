// the cinematic backdrop every scene sits on: near-black brand surface, two
// slow-drifting radial glows, a faint film grain and a vignette. also applies
// the scene's exit transition (fade + lift + blur) so cuts feel edited, not
// switched. brand tokens come from context; styles are computed per frame, so
// they are built as plain objects here rather than in a stylesheet.

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

import { useBrand, useConfig } from '../lib/context';
import { exitProgress } from '../lib/anim';
import { loadBrandFonts } from '../lib/fonts';

const glows = (w: number, h: number, drift: number, glow: string): React.CSSProperties => ({
  background: `radial-gradient(${w * 0.7}px ${h * 0.6}px at ${w * 0.22 + drift}px ${
    h * 0.18
  }px, ${glow}, transparent 70%), radial-gradient(${w * 0.6}px ${h * 0.55}px at ${
    w * 0.82 - drift
  }px ${h * 0.86}px, rgba(255,255,255,0.04), transparent 70%)`,
});

const exitWrap = (out: number): React.CSSProperties => ({
  opacity: 1 - out,
  transform: `translateY(${out * -28}px) scale(${1 - out * 0.012})`,
  filter: out > 0 ? `blur(${out * 8}px)` : undefined,
});

const vignette: React.CSSProperties = {
  pointerEvents: 'none',
  background: 'radial-gradient(120% 120% at 50% 45%, transparent 55%, rgba(0,0,0,0.42) 100%)',
};

const grainSvg: React.CSSProperties = { position: 'absolute', opacity: 0.05 };

export const Stage: React.FC<{
  children: React.ReactNode;
  glow?: string;
  exitLen?: number;
}> = ({ children, glow, exitLen = 12 }) => {
  const brand = useBrand();
  loadBrandFonts(useConfig().brand.fonts);
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const out = exitProgress(frame, durationInFrames, exitLen);
  const drift = Math.sin(frame / 90) * width * 0.03;
  const tint = glow ?? 'rgba(255,255,255,0.06)';

  return (
    <AbsoluteFill style={{ backgroundColor: brand.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={glows(width, height, drift, tint)} />
      <AbsoluteFill style={exitWrap(out)}>{children}</AbsoluteFill>
      <AbsoluteFill style={vignette} />
      <svg width="100%" height="100%" style={grainSvg}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 9} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
