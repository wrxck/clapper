// the sound-off caption: a short line pinned in the lower safe zone with a
// subtle scrim/box so it stays legible on muted feeds whatever sits behind it.
// it fades in once the scene has settled and rides above the format's safe
// insets (so it clears tiktok/reels caption + action rails on 9:16). a separate
// dev-only safe-area overlay draws the reserved zones for qa.

import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

import { useBrand, useFonts } from '../lib/context';
import { settle } from '../lib/anim';
import { useFrame } from '../lib/layout';

export const Caption: React.FC<{ text: string; delay?: number }> = ({ text, delay = 10 }) => {
  const brand = useBrand();
  const { text: textFont } = useFonts();
  const { u, portrait, safe } = useFrame();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = settle(frame, fps, delay);
  const size = portrait ? u(38) : u(34);
  return (
    <div
      style={{
        position: 'absolute',
        left: safe.left,
        right: safe.right,
        bottom: safe.bottom,
        display: 'flex',
        justifyContent: 'center',
        opacity: p,
        transform: `translateY(${(1 - p) * u(20)}px)`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: '92%',
          fontFamily: textFont,
          fontWeight: 560,
          fontSize: size,
          lineHeight: 1.18,
          letterSpacing: '-0.01em',
          color: brand.ink,
          textAlign: 'center',
          // scrim box: tinted brand surface + a soft outline + drop shadow so the
          // line reads over any frame regardless of contrast behind it.
          background: 'rgba(8,10,14,0.62)',
          border: `1px solid ${brand.surfaceEdge}`,
          borderRadius: u(18),
          padding: `${u(14)}px ${u(28)}px`,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

// dev-only overlay: paints the reserved safe insets so a reviewer can confirm
// captions and headlines stay inside the box. gated by the caller (a prop / env)
// so it never ships in a render.
export const SafeAreaOverlay: React.FC = () => {
  const { w, h, safe } = useFrame();
  const line = 'rgba(94,234,212,0.9)';
  const fill = 'rgba(94,234,212,0.08)';
  const band = (style: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    background: fill,
    ...style,
  });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
      <div style={band({ top: 0, left: 0, right: 0, height: safe.top })} />
      <div style={band({ bottom: 0, left: 0, right: 0, height: safe.bottom })} />
      <div style={band({ top: 0, bottom: 0, left: 0, width: safe.left })} />
      <div style={band({ top: 0, bottom: 0, right: 0, width: safe.right })} />
      <div
        style={{
          position: 'absolute',
          top: safe.top,
          left: safe.left,
          width: w - safe.left - safe.right,
          height: h - safe.top - safe.bottom,
          border: `2px dashed ${line}`,
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
};
