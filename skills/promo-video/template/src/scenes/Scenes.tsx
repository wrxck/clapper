// every scene archetype, each a pure function of its typed scene data + the
// frame. all read brand from context and size everything in `u`, so the same
// scene composes at any aspect ratio. one dispatcher (SceneView) maps a scene's
// `type` to its renderer.

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

import { Cards } from '../components/Cards';
import { Frame } from '../components/Frame';
import { Icon } from '../components/Icons';
import { Mark } from '../components/Mark';
import { Counter } from '../components/Motion';
import { Kinetic, Sub } from '../components/Type';
import { useBrand, useFonts } from '../lib/context';
import { settle } from '../lib/anim';
import { safePadding, useFrame } from '../lib/layout';
import type {
  BulletsScene,
  CtaScene,
  DeviceScene,
  FeaturesScene,
  PricingScene,
  Scene,
  StatScene,
  TitleScene,
} from '../schema';

const centre: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

// ---- title ----
export const TitleView: React.FC<{ scene: TitleScene }> = ({ scene }) => {
  const frame = useFrame();
  const { u, portrait } = frame;
  return (
    <AbsoluteFill style={{ ...centre, gap: u(30), ...safePadding(frame, u(60)) }}>
      {scene.showLogo ? <Mark size={u(150)} delay={2} /> : null}
      <Kinetic
        words={scene.words}
        size={portrait ? u(120) : u(150)}
        delay={scene.showLogo ? 16 : 4}
        stagger={7}
        weight={680}
      />
      {scene.sub ? <Sub text={scene.sub} size={u(34)} delay={scene.showLogo ? 30 : 18} /> : null}
    </AbsoluteFill>
  );
};

// ---- bullets ----
export const BulletsView: React.FC<{ scene: BulletsScene }> = ({ scene }) => {
  const brand = useBrand();
  const { display } = useFonts();
  const fr = useFrame();
  const { u, portrait } = fr;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const size = portrait ? u(54) : u(62);
  return (
    <AbsoluteFill style={{ ...centre, gap: u(50), ...safePadding(fr, u(70)) }}>
      {scene.heading ? (
        <Kinetic words={scene.heading.split(' ')} size={portrait ? u(70) : u(84)} delay={2} />
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: u(40) }}>
        {scene.items.map((row, i) => {
          const p = settle(frame, fps, (scene.heading ? 16 : 6) + i * 14);
          return (
            <div
              key={row.line}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: u(28),
                opacity: p,
                transform: `translateY(${(1 - p) * 40}px)`,
                filter: p < 0.98 ? `blur(${(1 - p) * 10}px)` : undefined,
              }}
            >
              <Icon name={row.icon} size={size * 0.92} colour={brand.accent} />
              <span
                style={{
                  fontFamily: display,
                  fontWeight: 600,
                  fontSize: size,
                  letterSpacing: '-0.03em',
                  color: brand.ink,
                }}
              >
                {row.line}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---- features ----
export const FeaturesView: React.FC<{ scene: FeaturesScene }> = ({ scene }) => {
  const fr = useFrame();
  const { u, portrait } = fr;
  return (
    <AbsoluteFill style={{ ...centre, gap: u(54), ...safePadding(fr, u(60)) }}>
      {scene.heading ? (
        <Kinetic words={scene.heading.split(' ')} size={portrait ? u(68) : u(80)} delay={2} />
      ) : null}
      <Cards scene={scene} t0={scene.heading ? 10 : 0} />
    </AbsoluteFill>
  );
};

// ---- device ----
export const DeviceView: React.FC<{ scene: DeviceScene }> = ({ scene }) => {
  const { u, portrait, square, safe } = useFrame();
  const variant = scene.frame;
  const phoneW = portrait ? u(440) : square ? u(380) : u(400);
  const browserW = portrait ? u(660) : square ? u(720) : u(900);
  const width = variant === 'browser' ? browserW : phoneW;

  const copy = scene.headline ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: u(16), alignItems: 'center' }}>
      <Kinetic words={scene.headline.split(' ')} size={portrait || square ? u(62) : u(74)} delay={2} />
      {scene.sub ? <Sub text={scene.sub} size={u(30)} delay={16} /> : null}
    </div>
  ) : null;

  // centre the device + copy vertically in the available shell, biasing slightly
  // up so a pinned caption never collides with it.
  const device = <Frame width={width} variant={variant} image={scene.image} enterDelay={8} />;

  if (portrait || square || variant === 'browser') {
    return (
      <AbsoluteFill
        style={{
          ...centre,
          gap: u(44),
          paddingTop: safe.top + u(46),
          paddingBottom: safe.bottom + u(46),
          paddingLeft: safe.left + u(46),
          paddingRight: safe.right + u(46),
        }}
      >
        {copy}
        {device}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{
        ...centre,
        flexDirection: 'row',
        gap: u(110),
        paddingTop: safe.top + u(60),
        paddingBottom: safe.bottom + u(60),
        paddingLeft: safe.left + u(60),
        paddingRight: safe.right + u(60),
      }}
    >
      {copy}
      {device}
    </AbsoluteFill>
  );
};

// ---- stat ----
export const StatView: React.FC<{ scene: StatScene }> = ({ scene }) => {
  const brand = useBrand();
  const { text } = useFonts();
  const fr = useFrame();
  const { u, portrait } = fr;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const labelP = settle(frame, fps, 24);
  return (
    <AbsoluteFill style={{ ...centre, gap: u(18), ...safePadding(fr, u(60)) }}>
      <Counter
        to={scene.value}
        start={6}
        len={48}
        size={portrait ? u(220) : u(280)}
        prefix={scene.prefix}
        suffix={scene.suffix}
        decimals={scene.decimals}
        colour={brand.accent}
      />
      <div
        style={{
          fontFamily: text,
          fontSize: portrait ? u(44) : u(52),
          fontWeight: 480,
          letterSpacing: '-0.01em',
          color: brand.inkMuted,
          textAlign: 'center',
          opacity: labelP,
          transform: `translateY(${(1 - labelP) * 30}px)`,
        }}
      >
        {scene.label}
      </div>
    </AbsoluteFill>
  );
};

// ---- pricing ----
export const PricingView: React.FC<{ scene: PricingScene }> = ({ scene }) => {
  const brand = useBrand();
  const { display } = useFonts();
  const fr = useFrame();
  const { u, portrait } = fr;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = settle(frame, fps, 4);
  const periodP = settle(frame, fps, 16);
  return (
    <AbsoluteFill style={{ ...centre, gap: u(20), ...safePadding(fr, u(60)) }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: u(14) }}>
        <span
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: portrait ? u(160) : u(200),
            letterSpacing: '-0.04em',
            color: brand.ink,
            opacity: p,
            transform: `translateY(${(1 - p) * 50}px)`,
          }}
        >
          {scene.price}
        </span>
        {scene.period ? (
          <span
            style={{
              fontFamily: display,
              fontWeight: 520,
              fontSize: portrait ? u(48) : u(60),
              color: brand.inkMuted,
              opacity: periodP,
            }}
          >
            {scene.period}
          </span>
        ) : null}
      </div>
      {scene.sub ? (
        <Kinetic
          words={scene.sub.split(' ')}
          size={portrait ? u(46) : u(54)}
          delay={22}
          colour={brand.inkMuted}
          weight={500}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ---- cta ----
export const CtaView: React.FC<{ scene: CtaScene }> = ({ scene }) => {
  const brand = useBrand();
  const { display, text } = useFonts();
  const fr = useFrame();
  const { u } = fr;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const showLogo = scene.showLogo ?? true;
  const nameP = settle(frame, fps, 14);
  const urlP = settle(frame, fps, 26);
  return (
    <AbsoluteFill style={{ ...centre, gap: u(30), ...safePadding(fr, u(60)) }}>
      {showLogo ? <Mark size={u(150)} delay={2} /> : null}
      <div
        style={{
          fontFamily: display,
          fontWeight: 660,
          fontSize: u(86),
          letterSpacing: '-0.035em',
          color: brand.ink,
          opacity: nameP,
          transform: `translateY(${(1 - nameP) * u(30)}px)`,
        }}
      >
        {brand.name}
      </div>
      <div
        style={{
          fontFamily: text,
          fontWeight: 560,
          fontSize: u(34),
          color: brand.bg,
          background: brand.ink,
          borderRadius: 999,
          padding: `${u(16)}px ${u(44)}px`,
          opacity: urlP,
          transform: `scale(${0.9 + urlP * 0.1})`,
        }}
      >
        {scene.url}
      </div>
      {scene.line ? <Sub text={scene.line} size={u(28)} delay={36} colour={brand.inkFaint} /> : null}
    </AbsoluteFill>
  );
};

// ---- dispatcher ----
export const SceneView: React.FC<{ scene: Scene }> = ({ scene }) => {
  switch (scene.type) {
    case 'title':
      return <TitleView scene={scene} />;
    case 'bullets':
      return <BulletsView scene={scene} />;
    case 'features':
      return <FeaturesView scene={scene} />;
    case 'device':
      return <DeviceView scene={scene} />;
    case 'stat':
      return <StatView scene={scene} />;
    case 'pricing':
      return <PricingView scene={scene} />;
    case 'cta':
      return <CtaView scene={scene} />;
  }
};
