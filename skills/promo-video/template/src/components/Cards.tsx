// the feature card grid: each card pops in on a stagger with an icon, a title
// and a description. cards reflow to one column in portrait. brand tokens from
// context; frame-driven, hence inline style objects.

import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

import { useBrand, useFonts } from '../lib/context';
import { pop } from '../lib/anim';
import { useFrame } from '../lib/layout';
import { Icon } from './Icons';
import type { FeaturesScene } from '../schema';

const cardStyle = (
  w: number,
  surface: string,
  edge: string,
  p: number,
): React.CSSProperties => ({
  flex: '1 1 0',
  minWidth: w * 0.5,
  background: surface,
  border: `1px solid ${edge}`,
  borderRadius: w * 0.04,
  padding: w * 0.06,
  display: 'flex',
  flexDirection: 'column',
  gap: w * 0.03,
  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  opacity: Math.min(1, p * 1.3),
  transform: `translateY(${(1 - p) * 50}px) scale(${0.96 + p * 0.04})`,
});

const iconWrap = (w: number, tint: string): React.CSSProperties => ({
  width: w * 0.13,
  height: w * 0.13,
  borderRadius: w * 0.035,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `${tint}1f`,
  border: `1px solid ${tint}3a`,
});

export const Cards: React.FC<{ scene: FeaturesScene; t0?: number }> = ({ scene, t0 = 0 }) => {
  const brand = useBrand();
  const { display, text } = useFonts();
  const { u, portrait } = useFrame();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accents = [brand.accent, brand.accent2, brand.accent3];
  const w = portrait ? u(620) : u(380);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: portrait ? 'column' : 'row',
        gap: u(28),
        justifyContent: 'center',
        alignItems: 'stretch',
        flexWrap: 'wrap',
        maxWidth: portrait ? u(720) : u(1500),
      }}
    >
      {scene.cards.map((c, i) => {
        const tint = accents[i % accents.length];
        const p = pop(frame, fps, t0 + 6 + i * 8);
        return (
          <div key={c.title} style={cardStyle(w, brand.surface, brand.surfaceEdge, p)}>
            <div style={iconWrap(w, tint)}>
              <Icon name={c.icon} size={w * 0.07} colour={tint} />
            </div>
            <div
              style={{
                fontFamily: display,
                fontWeight: 620,
                fontSize: w * 0.072,
                letterSpacing: '-0.02em',
                color: brand.ink,
              }}
            >
              {c.title}
            </div>
            <div style={{ fontFamily: text, fontSize: w * 0.05, lineHeight: 1.35, color: brand.inkMuted }}>
              {c.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
};
