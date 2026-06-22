// the single typed contract for the whole film. this zod schema validates
// clapper.config.json, drives the remotion composition `schema`/`defaultProps`,
// and is imported by the tuning ui so the form and the film never drift. every
// exported type below is inferred from the schema - there is one source of truth.

import { z } from 'zod';
import { zColor } from '@remotion/zod-types';

// a font face the film loads at runtime via FontFace + delayRender.
export const fontFaceSchema = z.object({
  family: z.string(),
  url: z.string(),
  weight: z.string().optional(),
  style: z.enum(['normal', 'italic']).optional(),
});

// the logo: either an image in public/ or an array of svg path `d` strings that
// draw on with a stroke-dash reveal (the mark component).
export const logoSchema = z.object({
  type: z.enum(['image', 'paths']),
  src: z.union([z.string(), z.array(z.string())]),
});

export const brandSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  bg: zColor(),
  surface: zColor(),
  surfaceEdge: zColor(),
  ink: zColor(),
  inkMuted: zColor(),
  inkFaint: zColor(),
  accent: zColor(),
  accent2: zColor(),
  accent3: zColor(),
  good: zColor(),
  fontDisplay: z.string(),
  fontText: z.string(),
  fonts: z.array(fontFaceSchema).optional(),
  logo: logoSchema.optional(),
});

export const formatSchema = z.object({
  id: z.string(),
  label: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

// the icon names the inline icon set understands (see components/Icons.tsx).
export const iconNameSchema = z.enum([
  'check',
  'lock',
  'bolt',
  'cloud',
  'chart',
  'shield',
  'eye-off',
  'sparkle',
  'star',
  'heart',
  'globe',
  'device',
]);

// ---- scenes: a discriminated union of typed beats ----

const sceneBase = {
  durSec: z.number().positive(),
  // optional per-scene glow tint for the stage backdrop.
  glow: zColor().optional(),
};

export const titleSceneSchema = z.object({
  type: z.literal('title'),
  ...sceneBase,
  words: z.array(z.string()),
  sub: z.string().optional(),
  // draw the brand logo mark above the words.
  showLogo: z.boolean().optional(),
});

export const bulletsSceneSchema = z.object({
  type: z.literal('bullets'),
  ...sceneBase,
  heading: z.string().optional(),
  items: z.array(z.object({ icon: iconNameSchema, line: z.string() })),
});

export const featuresSceneSchema = z.object({
  type: z.literal('features'),
  ...sceneBase,
  heading: z.string().optional(),
  cards: z.array(
    z.object({ icon: iconNameSchema, title: z.string(), desc: z.string() }),
  ),
});

export const deviceSceneSchema = z.object({
  type: z.literal('device'),
  ...sceneBase,
  // frame style around the screenshot.
  frame: z.enum(['phone', 'browser', 'dashboard']).default('phone'),
  // screenshot in public/ (omit for the built-in dashboard variant).
  image: z.string().optional(),
  caption: z.string().optional(),
  sub: z.string().optional(),
});

export const statSceneSchema = z.object({
  type: z.literal('stat'),
  ...sceneBase,
  value: z.number(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  decimals: z.number().int().min(0).max(3).optional(),
  label: z.string(),
});

export const pricingSceneSchema = z.object({
  type: z.literal('pricing'),
  ...sceneBase,
  price: z.string(),
  period: z.string().optional(),
  sub: z.string().optional(),
});

export const ctaSceneSchema = z.object({
  type: z.literal('cta'),
  ...sceneBase,
  url: z.string(),
  line: z.string().optional(),
  showLogo: z.boolean().optional(),
});

export const sceneSchema = z.discriminatedUnion('type', [
  titleSceneSchema,
  bulletsSceneSchema,
  featuresSceneSchema,
  deviceSceneSchema,
  statSceneSchema,
  pricingSceneSchema,
  ctaSceneSchema,
]);

export const configSchema = z.object({
  brand: brandSchema,
  fps: z.number().int().positive().default(30),
  formats: z.array(formatSchema),
  scenes: z.array(sceneSchema),
});

export type FontFaceDef = z.infer<typeof fontFaceSchema>;
export type Logo = z.infer<typeof logoSchema>;
export type Brand = z.infer<typeof brandSchema>;
export type Format = z.infer<typeof formatSchema>;
export type IconName = z.infer<typeof iconNameSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type SceneType = Scene['type'];
export type TitleScene = z.infer<typeof titleSceneSchema>;
export type BulletsScene = z.infer<typeof bulletsSceneSchema>;
export type FeaturesScene = z.infer<typeof featuresSceneSchema>;
export type DeviceScene = z.infer<typeof deviceSceneSchema>;
export type StatScene = z.infer<typeof statSceneSchema>;
export type PricingScene = z.infer<typeof pricingSceneSchema>;
export type CtaScene = z.infer<typeof ctaSceneSchema>;
export type Config = z.infer<typeof configSchema>;
