// the device: a clean frame wrapping a screenshot image, so the device scene
// works for ANY app via a single screenshot. three frame styles:
//   - "phone": an iphone-style body with a dynamic-island notch.
//   - "browser": a desktop browser chrome with a faux address bar.
//   - "dashboard": a built-in synthetic stat dashboard (no screenshot needed) -
//     a kcal-style ring counting up plus three filling metric bars.
// the frame lifts in and holds a slow tilt/parallax. all frame-driven, hence the
// inline style objects.

import React from 'react';
import { Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

import { useBrand, useFonts } from '../lib/context';
import { ease, settle } from '../lib/anim';
import { Counter, Ring } from './Motion';

const resolveSrc = (s: string): string =>
  /^(https?:)?\/\//.test(s) || s.startsWith('data:') ? s : staticFile(s);

// ---- phone ----
const PhoneShell: React.FC<{ width: number; enter: number; tilt: number; children: React.ReactNode }> = ({
  width: w,
  enter,
  tilt,
  children,
}) => {
  const h = w * 2.05;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: w * 0.155,
        background: '#16161a',
        border: `${Math.max(2, w * 0.012)}px solid #2c2c33`,
        boxShadow: `0 ${w * 0.12}px ${w * 0.5}px rgba(0,0,0,0.6), inset 0 0 ${w * 0.02}px rgba(255,255,255,0.06)`,
        padding: w * 0.028,
        transform: `translateY(${(1 - enter) * h * 0.25}px) perspective(${w * 6}px) rotateY(${tilt}deg) rotateX(${tilt * 0.4}deg)`,
        opacity: Math.min(1, enter * 1.4),
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: w * 0.055,
          left: '50%',
          transform: 'translateX(-50%)',
          width: w * 0.3,
          height: w * 0.082,
          borderRadius: w * 0.05,
          background: '#000',
          zIndex: 3,
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: w * 0.125,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ---- browser ----
const BrowserShell: React.FC<{
  width: number;
  enter: number;
  tilt: number;
  url: string;
  children: React.ReactNode;
}> = ({ width: w, enter, tilt, url, children }) => {
  const brand = useBrand();
  const { text } = useFonts();
  const h = w * 0.62;
  const bar = w * 0.072;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: w * 0.018,
        background: brand.surface,
        border: `1px solid ${brand.surfaceEdge}`,
        boxShadow: `0 ${w * 0.04}px ${w * 0.16}px rgba(0,0,0,0.55)`,
        overflow: 'hidden',
        transform: `translateY(${(1 - enter) * h * 0.18}px) perspective(${w * 5}px) rotateX(${tilt * 0.5}deg)`,
        opacity: Math.min(1, enter * 1.4),
      }}
    >
      <div
        style={{
          height: bar,
          display: 'flex',
          alignItems: 'center',
          gap: w * 0.012,
          padding: `0 ${w * 0.02}px`,
          background: brand.bg,
          borderBottom: `1px solid ${brand.surfaceEdge}`,
        }}
      >
        {[brand.accent3, brand.accent2, brand.good].map((c) => (
          <span key={c} style={{ width: bar * 0.18, height: bar * 0.18, borderRadius: '50%', background: c, opacity: 0.85 }} />
        ))}
        <div
          style={{
            marginLeft: w * 0.02,
            flex: 1,
            height: bar * 0.5,
            borderRadius: bar,
            background: brand.surface,
            border: `1px solid ${brand.surfaceEdge}`,
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${w * 0.018}px`,
            fontFamily: text,
            fontSize: bar * 0.3,
            color: brand.inkFaint,
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ position: 'relative', width: '100%', height: h - bar }}>{children}</div>
    </div>
  );
};

// ---- the synthetic dashboard (no screenshot) ----
const Dashboard: React.FC = () => {
  const brand = useBrand();
  const { display, text } = useFonts();
  const frame = useCurrentFrame();
  const accents = [brand.accent, brand.accent2, brand.accent3];
  const ringP = ease(frame, 14, 70, 0, 0.78);
  const bars = [
    { name: 'Active', to: 0.82, d: 26 },
    { name: 'Engaged', to: 0.61, d: 32 },
    { name: 'Retained', to: 0.48, d: 38 },
  ];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: brand.bg,
        display: 'flex',
        flexDirection: 'column',
        padding: '7%',
        gap: '5%',
      }}
    >
      <div style={{ fontFamily: display, fontWeight: 640, fontSize: '7%', color: brand.ink, letterSpacing: '-0.02em' }}>
        Overview
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6%', flex: 1 }}>
        <div style={{ position: 'relative', width: '36%', aspectRatio: '1' }}>
          <Ring size={120} progress={ringP} stroke={12} colour={brand.accent} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Counter to={94} start={14} len={56} size={26} suffix="%" />
            <span style={{ fontFamily: text, fontSize: 11, color: brand.inkFaint }}>uptime</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10%' }}>
          {bars.map((m, i) => (
            <div key={m.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: text, fontSize: 13, color: brand.inkMuted }}>{m.name}</span>
              <div style={{ height: 8, borderRadius: 4, background: brand.surfaceEdge, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${ease(frame, m.d, m.d + 50, 0, m.to) * 100}%`,
                    height: '100%',
                    borderRadius: 4,
                    background: accents[i],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Frame: React.FC<{
  width: number;
  variant: 'phone' | 'browser' | 'dashboard';
  image?: string;
  url?: string;
  enterDelay?: number;
}> = ({ width: w, variant, image, url = 'app', enterDelay = 0 }) => {
  const brand = useBrand();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = settle(frame, fps, enterDelay);
  const tilt = Math.sin(frame / 70) * 1.6;

  const screen = image ? (
    <Img src={resolveSrc(image)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
  ) : (
    <Dashboard />
  );

  if (variant === 'browser') {
    return (
      <BrowserShell width={w} enter={enter} tilt={tilt} url={url}>
        {image ? screen : <Dashboard />}
      </BrowserShell>
    );
  }
  if (variant === 'dashboard' && !image) {
    return (
      <PhoneShell width={w} enter={enter} tilt={tilt}>
        <div style={{ position: 'absolute', inset: 0, background: brand.bg }}>
          <Dashboard />
        </div>
      </PhoneShell>
    );
  }
  return (
    <PhoneShell width={w} enter={enter} tilt={tilt}>
      {screen}
    </PhoneShell>
  );
};
