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
//   --review          small jpeg stills (scale 0.4, vertical only) for fast
//                     visual / model review - tiny payloads that never hit an
//                     image-size limit when read back. output under out/stills/review/.

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const entry = 'src/index.ts';

const args = process.argv.slice(2);
const brandOnly = args.includes('--brand-only');
const review = args.includes('--review');
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
  // review mode defaults to the vertical only (the tightest layout) to keep the
  // set small; full review still renders both extremes.
  const base = review ? ['Vertical'] : DEFAULT_FORMATS;
  formatIds = base.filter((id) => allFormatIds.includes(id));
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

// pick a settled hold frame, not the geometric midpoint. the kinetic headlines,
// the logo stroke-on and the price line all reveal word-by-word over the first
// ~30-50 frames of a scene; sampling at the raw midpoint catches them mid-reveal
// (a greyed/two-tone wordmark, an open-vs-closed logo arc, a motion-blurred price)
// which reads as a composition defect when it is only a reveal artefact. so we
// bias the sample late: past a settle margin from the start, but clear of the
// final exit transition (the stage fades/blurs out over the last ~12 frames).
const EXIT_LEN = 12;
const SETTLE_MARGIN = 56; // frames: clears the longest per-word reveal + tail
const holdFrame = (i) => {
  const { from, dur } = spans[i];
  const mid = from + Math.floor(dur / 2);
  // latest frame that is still before the exit starts (with a small guard).
  const beforeExit = from + dur - EXIT_LEN - 4;
  const settled = from + Math.min(SETTLE_MARGIN, dur - 1);
  // take the later of midpoint and settle margin, then clamp before the exit; if
  // the scene is too short to clear the reveal, fall back to its last held frame.
  const target = Math.max(mid, settled);
  return Math.max(from, Math.min(target, Math.max(from, beforeExit)));
};

let rendered = 0;
for (const fmt of formatIds) {
  const outDir = join(root, 'out', 'stills', review ? join('review', fmt) : fmt);
  mkdirSync(outDir, { recursive: true });
  for (const i of targets) {
    const scene = scenes[i];
    const name = brandOnly ? 'brand' : `${pad(i)}-${scene.type}`;
    const out = join(outDir, `${name}.${review ? 'jpeg' : 'png'}`);
    const frame = holdFrame(i);
    process.stderr.write(`stills: ${fmt} scene ${i + 1}/${scenes.length} (${scene.type}) @ frame ${frame}\n`);
    const stillArgs = ['remotion', 'still', entry, fmt, out, `--frame=${frame}`];
    if (review) stillArgs.push('--image-format=jpeg', '--scale=0.4');
    const res = spawnSync('npx', stillArgs, { cwd: root, stdio: ['ignore', 'ignore', 'inherit'], env: process.env });
    if (res.status !== 0) {
      fail(`remotion still failed for format ${fmt} scene ${i} (exit ${res.status ?? 'signal'})`);
    }
    rendered += 1;
  }
}

process.stderr.write(`stills: done, ${rendered} png(s) under out/stills/\n`);
