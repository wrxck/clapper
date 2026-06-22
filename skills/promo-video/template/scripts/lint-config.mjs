#!/usr/bin/env node
// lint-config: cheap structural checks on clapper.config.json that catch the
// "looks fine, reads wrong" smells the quality review keeps re-finding. it does
// not replace looking at the stills - it just flags the mechanical mistakes up
// front so the human/stills pass can focus on craft.
//
// it reads clapper.config.json and reports:
//   - stat smells: a counter with value 0 and no prefix/suffix (a qualitative
//     point dressed up as a number), or a label that is a sentence not a phrase.
//   - device smell: the product beat is the synthetic dashboard (frame
//     "dashboard" with no image, or no screenshots in public/ at all).
//   - pricing smell: a spelled-out currency ("pounds"/"dollars"/"euros") instead
//     of a glyph, or a sub-line over the <= 9-word rule.
//   - film-level redundancy: a single theme owning more than one beat.
//
// usage:
//   npm run lint                 # warn-only, exit 0
//   npm run lint -- --strict     # exit 1 if anything is flagged (for CI)

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const strict = process.argv.includes('--strict');

const findings = [];
const flag = (where, msg) => findings.push(`${where}: ${msg}`);

let config;
try {
  config = JSON.parse(readFileSync(join(root, 'clapper.config.json'), 'utf8'));
} catch (e) {
  process.stderr.write(`lint: could not read clapper.config.json: ${e.message}\n`);
  process.exit(1);
}

const scenes = Array.isArray(config.scenes) ? config.scenes : [];

// what screenshots exist to point a device beat at.
let publicFiles = [];
try {
  publicFiles = readdirSync(join(root, 'public'));
} catch {
  publicFiles = [];
}
const hasScreenshots = publicFiles.some((f) => /\.(png|jpe?g|webp|avif)$/i.test(f));

// a label/sub reads as a sentence (not a short phrase) if it is long or ends in
// terminal punctuation / contains a sentence break.
const looksLikeSentence = (s) => {
  if (typeof s !== 'string') return false;
  const words = s.trim().split(/\s+/).length;
  return /[.!?]\s+\S/.test(s) || /[.!?]$/.test(s.trim()) || words > 6;
};
const wordCount = (s) => (typeof s === 'string' ? s.trim().split(/\s+/).length : 0);

const themeWords = {
  privacy: /\b(privac|private|on-?device|no ads|no account|no tracking|icloud|your data|never (sees|leaves|sold)|stays with you|zero (accounts|servers|ads))\b/i,
  speed: /\b(seconds|instant|fast|in a tap|one tap)\b/i,
  price: /\b(free|trial|£|\$|€|a month|for life|once)\b/i,
};
const themeCounts = {};

scenes.forEach((s, i) => {
  const at = `scene ${i + 1} (${s.type})`;

  if (s.type === 'stat') {
    const noAffix = !s.prefix && !s.suffix;
    if ((s.value === 0 || s.value === undefined) && noAffix) {
      flag(at, 'stat value 0 with no prefix/suffix - this is a qualitative point, not a number. Use bullets or title.');
    }
    if (looksLikeSentence(s.label)) {
      flag(at, `stat label is a sentence, not a short phrase: "${s.label}". A label completes the number.`);
    }
  }

  if (s.type === 'device') {
    const synthetic = (s.frame === 'dashboard' || !s.frame) && !s.image;
    if (synthetic) {
      flag(at, 'product beat is the synthetic dashboard, not a real screenshot. Set frame:"phone"/"browser" + image:"<file>.png".');
    }
    if (s.image && !publicFiles.includes(s.image) && !/^(https?:)?\/\//.test(s.image) && !s.image.startsWith('data:')) {
      flag(at, `image "${s.image}" is not in public/ - the device frame will fail to load it.`);
    }
  }

  if (s.type === 'device' && !hasScreenshots && !s.image) {
    flag(at, 'public/ has no screenshots, so the product beat cannot show the real app.');
  }

  if (s.type === 'pricing') {
    const sub = s.sub ?? '';
    if (/\b(pounds?|dollars?|euros?)\b/i.test(sub) || /\b(pounds?|dollars?|euros?)\b/i.test(s.price ?? '')) {
      flag(at, 'pricing uses a spelled-out currency - prefer the glyph (£/$/€).');
    }
    if (wordCount(sub) > 9) {
      flag(at, `pricing sub is ${wordCount(sub)} words (> 9) - tighten to one offer per line.`);
    }
  }

  // theme tally across the whole film for the redundancy check. count a beat
  // toward a theme only when the theme owns the beat (its headline/heading/items),
  // so the standard hook->values arc (a tension line teasing what a later values
  // beat delivers) is not mistaken for duplication. the device/product beat is the
  // hero shot and is allowed to tease any theme, so it never counts.
  if (s.type !== 'device') {
    const owning = [s.heading, s.line, s.label]
      .concat((s.items ?? []).map((it) => it.line))
      .filter(Boolean)
      .join(' ');
    for (const [theme, re] of Object.entries(themeWords)) {
      if (re.test(owning)) themeCounts[theme] = (themeCounts[theme] ?? 0) + 1;
    }
  }
});

// a theme that dominates 3+ beats is the redundancy failure (e.g. privacy stated
// in a stat, a bullets and a title). 2 is the normal hook/values pairing.
for (const [theme, n] of Object.entries(themeCounts)) {
  if (n >= 3) {
    flag('film', `theme "${theme}" owns ${n} beats - one idea per scene applies across the film. Keep the strongest, cut/re-theme the rest.`);
  }
}

if (findings.length === 0) {
  process.stderr.write('lint: no structural smells found (still look at the stills).\n');
  process.exit(0);
}

process.stderr.write(`lint: ${findings.length} finding(s):\n`);
for (const f of findings) process.stderr.write(`  - ${f}\n`);
process.exit(strict ? 1 : 0);
