// the brand mark. two modes, chosen by brand.logo.type:
//   - "paths": an array of svg path `d` strings drawn on with a stroke-dash
//     reveal (pathLength normalised so every stroke draws in sync).
//   - "image": a logo file from public/ that fades and lifts in.
// when no logo is configured the wordmark initial is drawn as a fallback glyph.

import React from 'react';
import { Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

import { useBrand, useFonts } from '../lib/context';
import { settle } from '../lib/anim';

export const Mark: React.FC<{ size: number; delay?: number; stroke?: string }> = ({
  size,
  delay = 0,
  stroke,
}) => {
  const brand = useBrand();
  const { display } = useFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colour = stroke ?? brand.ink;
  const logo = brand.logo;

  if (logo?.type === 'image' && typeof logo.src === 'string') {
    const p = settle(frame, fps, delay);
    const src = /^(https?:)?\/\//.test(logo.src) ? logo.src : staticFile(logo.src);
    return (
      <Img
        src={src}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          opacity: p,
          transform: `translateY(${(1 - p) * size * 0.3}px) scale(${0.92 + p * 0.08})`,
        }}
      />
    );
  }

  if (logo?.type === 'paths' && Array.isArray(logo.src)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {logo.src.map((d, i) => {
          const p = settle(frame, fps, delay + i * 2);
          return (
            <path
              key={d}
              d={d}
              stroke={colour}
              strokeWidth={2.1}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
            />
          );
        })}
      </svg>
    );
  }

  // fallback: the brand initial in a soft rounded tile.
  const p = settle(frame, fps, delay);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        background: brand.surface,
        border: `1px solid ${brand.surfaceEdge}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: display,
        fontWeight: 700,
        fontSize: size * 0.5,
        color: colour,
        opacity: p,
        transform: `scale(${0.9 + p * 0.1})`,
      }}
    >
      {brand.name.charAt(0).toUpperCase()}
    </div>
  );
};
