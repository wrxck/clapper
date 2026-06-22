#!/usr/bin/env node
// stills: render one representative still per scene for the qa loop, so you can
// eyeball every beat without sitting through a full encode. it reads
// clapper.config.json, computes each scene's mid-frame on the same timeline the
// film uses, and renders via `remotion still` into out/stills/<format>/<NN-type>.png.
//
// by default it renders the 9:16 vertical and the 16:9 wide (the two extremes for
// layout and safe-area review). runs headless and exits non-zero on any failure.
//
// usage:
//   npm run stills                  # per-scene stills for vertical + wide
//   npm run stills -- --brand-only  # a single brand/title card (first scene)
//   npm run stills -- --format=Square
//   npm run stills -- --format=Vertical --format=Wide
//
// flags:
//   --brand-only      render only one still: the first title scene (or scene 0)
//   --format=<id>     restrict to the given format id(s); repeatable

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const entry = 'src/index.ts';

const args = process.argv.slice(2);
const brandOnly = args.includes('--brand-only');
const wanted = args
  .filter((a) => a.startsWith('--format='))
  .map((a) => a.slice('--format='.length))
  .filter(Boolean);

// default review set: the two layout extremes.
const DEFAULT_FORMATS = ['Vertical', 'Wide'];

const fail = (msg) => {
  process.stderr.write(`stills: ${msg}\n`);
  process.exit(1);
};

let config;
try {
  config = JSON.parse(readFileSync(join(root, 'clapper.config.json'), 'utf8'));
} catch (e) {
  fail(`could not read clapper.config.json: ${e.message}`);
}

const fps = Number(config.fps) || 30;
const scenes = Array.isArray(config.scenes) ? config.scenes : [];
if (scenes.length === 0) fail('no scenes in clapper.config.json');

const allFormatIds = (config.formats ?? []).map((f) => f.id);
if (allFormatIds.length === 0) fail('no formats in clapper.config.json');

// resolve which formats to render: requested ones that exist, else the default
// set filtered to what the config actually has.
let formatIds;
if (wanted.length) {
  formatIds = wanted.filter((id) => allFormatIds.includes(id));
  const missing = wanted.filter((id) => !allFormatIds.includes(id));
  if (missing.length) process.stderr.write(`stills: unknown format(s) ignored: ${missing.join(', ')}\n`);
  if (!formatIds.length) fail('none of the requested formats exist in the config');
} else {
  formatIds = DEFAULT_FORMATS.filter((id) => allFormatIds.includes(id));
  if (!formatIds.length) formatIds = [allFormatIds[0]];
}

// the timeline: each scene's frame span, mirroring lib/timeline.ts exactly so the
// mid-frame we pick is the same frame the film shows mid-scene.
const spans = [];
let cursor = 0;
for (const s of scenes) {
  const dur = Math.max(1, Math.round((Number(s.durSec) || 1) * fps));
  spans.push({ from: cursor, dur });
  cursor += dur;
}

// pick the scenes to render. brand-only: the first title scene, else scene 0.
let targets;
if (brandOnly) {
  let idx = scenes.findIndex((s) => s.type === 'title');
  if (idx < 0) idx = 0;
  targets = [idx];
} else {
  targets = scenes.map((_, i) => i);
}

const pad = (n) => String(n + 1).padStart(2, '0');
const midFrame = (i) => spans[i].from + Math.floor(spans[i].dur / 2);

let rendered = 0;
for (const fmt of formatIds) {
  const outDir = join(root, 'out', 'stills', fmt);
  mkdirSync(outDir, { recursive: true });
  for (const i of targets) {
    const scene = scenes[i];
    const name = brandOnly ? 'brand' : `${pad(i)}-${scene.type}`;
    const out = join(outDir, `${name}.png`);
    const frame = midFrame(i);
    process.stderr.write(`stills: ${fmt} scene ${i + 1}/${scenes.length} (${scene.type}) @ frame ${frame}\n`);
    const res = spawnSync(
      'npx',
      ['remotion', 'still', entry, fmt, out, `--frame=${frame}`],
      { cwd: root, stdio: ['ignore', 'ignore', 'inherit'], env: process.env },
    );
    if (res.status !== 0) {
      fail(`remotion still failed for format ${fmt} scene ${i} (exit ${res.status ?? 'signal'})`);
    }
    rendered += 1;
  }
}

process.stderr.write(`stills: done, ${rendered} png(s) under out/stills/\n`);
