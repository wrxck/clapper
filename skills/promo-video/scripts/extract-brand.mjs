#!/usr/bin/env node
// extract-brand: scan a target repo for brand tokens and print a clapper config
// `brand` object (plus notes on what was found vs guessed) to stdout. heuristic
// and resilient - it never throws on a repo it does not understand, it just
// guesses sensible defaults and says so. zero dependencies (node stdlib only).
//
// usage:
//   node extract-brand.mjs <repo-root> [--merge clapper.config.json] [--json]
//
//   <repo-root>        directory to scan (default: cwd)
//   --merge <file>     merge the extracted brand into an existing config file
//                      and print the whole config (otherwise print just brand)
//   --json             print machine-readable json only (suppress notes)
//
// the output `brand` matches src/schema.ts: name, tagline, the colour tokens,
// fontDisplay/fontText, optional fonts[] and logo.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename, extname, relative } from 'node:path';

const args = process.argv.slice(2);
const root = args.find((a) => !a.startsWith('--')) ?? '.';
const mergeIdx = args.indexOf('--merge');
const mergeFile = mergeIdx >= 0 ? args[mergeIdx + 1] : null;
const jsonOnly = args.includes('--json');

const notes = [];
const note = (kind, msg) => notes.push(`${kind === 'found' ? '[found]' : '[guess]'} ${msg}`);

// ---- tiny, bounded file walker (skips heavy/irrelevant dirs) ----
const SKIP = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', 'coverage',
  '.cache', 'vendor', 'target', '.venv', '__pycache__',
]);
const MAX_FILES = 6000;

function* walk(dir, depth = 0) {
  if (depth > 8) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.well-known') {
      if (e.isDirectory()) continue;
    }
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP.has(e.name)) continue;
      yield* walk(full, depth + 1);
    } else {
      yield full;
    }
  }
}

const read = (p) => {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '';
  }
};

// collect candidate files once, capped for speed.
const files = [];
for (const f of walk(root)) {
  files.push(f);
  if (files.length >= MAX_FILES) break;
}

const byExt = (exts) => files.filter((f) => exts.includes(extname(f).toLowerCase()));
const cssFiles = byExt(['.css', '.scss', '.sass', '.less', '.pcss']);
const styleish = files.filter((f) =>
  /\.(css|scss|sass|less|pcss|ts|tsx|js|jsx|vue|svelte|astro|html)$/i.test(f),
);

// ---- colour parsing ----
const isColour = (v) =>
  /^#([0-9a-f]{3,8})$/i.test(v) ||
  /^(rgb|rgba|hsl|hsla|oklch|oklab)\(/i.test(v) ||
  /^[a-z]{3,}$/i.test(v); // named (rare)

// gather css custom properties from declarations like `--name: value;`.
const customProps = new Map(); // name -> value (last wins, like the cascade)
const varRefs = new Map(); // name -> count of references (popularity)

for (const f of styleish) {
  const src = read(f);
  if (!src) continue;
  for (const m of src.matchAll(/--([a-z0-9-]+)\s*:\s*([^;{}]+);/gi)) {
    const name = m[1].toLowerCase();
    const val = m[2].trim();
    customProps.set(name, val);
  }
  for (const m of src.matchAll(/var\(\s*--([a-z0-9-]+)/gi)) {
    const n = m[1].toLowerCase();
    varRefs.set(n, (varRefs.get(n) ?? 0) + 1);
  }
}

// resolve a custom-property value, following one level of var() indirection.
const resolveVar = (val, seen = new Set()) => {
  if (!val) return val;
  const m = val.match(/^var\(\s*--([a-z0-9-]+)\s*(?:,\s*([^)]+))?\)/i);
  if (m) {
    const ref = m[1].toLowerCase();
    if (!seen.has(ref) && customProps.has(ref)) {
      seen.add(ref);
      return resolveVar(customProps.get(ref), seen);
    }
    if (m[2]) return m[2].trim();
  }
  return val;
};

// pick a custom property by trying a list of name patterns (regex), returning the
// first colour-valued match, most-referenced first to favour real tokens.
const sortedProps = [...customProps.keys()].sort(
  (a, b) => (varRefs.get(b) ?? 0) - (varRefs.get(a) ?? 0),
);

const pickProp = (patterns) => {
  for (const re of patterns) {
    for (const name of sortedProps) {
      if (re.test(name)) {
        const val = resolveVar(customProps.get(name));
        if (val && isColour(val.split(/\s/)[0])) return { name, value: val.trim() };
      }
    }
  }
  return null;
};

// ---- tailwind theme colours ----
// look in tailwind.config.* and any `@theme {}` block (tailwind v4) for named
// colours, especially a `primary`/`brand`/`accent` family.
const tailwindColours = new Map();
const twConfigs = files.filter((f) => /tailwind\.config\.[cm]?[jt]s$/i.test(basename(f)));
for (const f of twConfigs) {
  const src = read(f);
  for (const m of src.matchAll(/['"]?([a-z][a-z0-9-]*)['"]?\s*:\s*['"](#[0-9a-f]{3,8})['"]/gi)) {
    tailwindColours.set(m[1].toLowerCase(), m[2]);
  }
}
for (const f of cssFiles) {
  const src = read(f);
  const theme = src.match(/@theme[^{]*\{([\s\S]*?)\}/i);
  if (theme) {
    for (const m of theme[1].matchAll(/--color-([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
      const v = resolveVar(m[2].trim());
      if (isColour(v.split(/\s/)[0])) tailwindColours.set(m[1].toLowerCase(), v.trim());
    }
  }
}

const pickTailwind = (names) => {
  for (const n of names) {
    for (const [k, v] of tailwindColours) {
      if (k === n || k.startsWith(n + '-')) return { name: k, value: v };
    }
  }
  return null;
};

// ---- fonts ----
const fonts = [];
const families = new Set();
const fontFiles = byExt(['.woff2', '.woff', '.ttf', '.otf']);

// @font-face declarations.
for (const f of styleish) {
  const src = read(f);
  for (const block of src.matchAll(/@font-face\s*\{([\s\S]*?)\}/gi)) {
    const fam = block[1].match(/font-family\s*:\s*['"]?([^;'"]+)['"]?/i);
    const url = block[1].match(/url\(\s*['"]?([^)'"]+\.(?:woff2|woff|ttf|otf))['"]?/i);
    if (fam) {
      const name = fam[1].trim();
      if (!families.has(name)) {
        families.add(name);
        const entry = { family: name };
        if (url) entry.url = url[1].trim();
        fonts.push(entry);
      }
    }
  }
}

// google fonts <link> / @import.
const googleFamilies = [];
for (const f of styleish) {
  const src = read(f);
  for (const m of src.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&\s)]+)/gi)) {
    for (const fam of m[1].split('|')) {
      const name = decodeURIComponent(fam.split(':')[0].replace(/\+/g, ' ')).trim();
      if (name && !googleFamilies.includes(name)) googleFamilies.push(name);
    }
  }
}

if (fonts.length) note('found', `${fonts.length} @font-face famil${fonts.length === 1 ? 'y' : 'ies'}: ${fonts.map((f) => f.family).join(', ')}`);
if (googleFamilies.length) note('found', `google fonts: ${googleFamilies.join(', ')}`);
if (fontFiles.length) note('found', `${fontFiles.length} font file(s) under the repo (under public/ or assets/)`);

// choose display + text families. prefer a distinct display face if there are
// two; otherwise reuse the one we have.
const allFamilies = [...new Set([...fonts.map((f) => f.family), ...googleFamilies])];
let fontDisplay = allFamilies[0] ?? 'Space Grotesk';
let fontText = allFamilies[1] ?? allFamilies[0] ?? 'Inter';
if (!allFamilies.length) note('guess', 'no fonts detected; defaulting to Space Grotesk / Inter');

// ---- logo ----
let logo = null;
const publicDirs = ['public', 'static', 'assets', 'src/assets', 'app/assets'];
const looksLogo = (p) => /logo|brand|wordmark|icon|favicon|mark/i.test(basename(p));
const svgs = byExt(['.svg']).filter(looksLogo);
const pngs = byExt(['.png', '.webp']).filter(looksLogo);
const favicon = files.find((f) => /favicon\.(svg|png|ico)$/i.test(basename(f)));

const inPublic = (p) => publicDirs.some((d) => p.replace(/\\/g, '/').includes(`/${d}/`));
const logoCandidate = svgs.find(inPublic) ?? svgs[0] ?? pngs.find(inPublic) ?? pngs[0] ?? favicon;

if (logoCandidate) {
  // try to extract path `d` data from an svg for the stroke-on mark; fall back to
  // referencing the file as an image.
  if (extname(logoCandidate).toLowerCase() === '.svg') {
    const src = read(logoCandidate);
    const ds = [...src.matchAll(/\sd=["']([^"']+)["']/g)].map((m) => m[1]).slice(0, 8);
    if (ds.length && ds.length <= 8) {
      logo = { type: 'paths', src: ds };
      note('found', `logo svg with ${ds.length} path(s): ${relative(root, logoCandidate)} (copy into promo/public/ if you switch to image)`);
    } else {
      logo = { type: 'image', src: basename(logoCandidate) };
      note('found', `logo svg: ${relative(root, logoCandidate)} (copy into promo/public/${basename(logoCandidate)})`);
    }
  } else {
    logo = { type: 'image', src: basename(logoCandidate) };
    note('found', `logo image: ${relative(root, logoCandidate)} (copy into promo/public/${basename(logoCandidate)})`);
  }
} else {
  note('guess', 'no logo found; the film will draw the brand initial as a fallback mark');
}

// ---- name + tagline ----
let name = null;
let tagline = null;

const pkgPath = join(root, 'package.json');
if (existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(read(pkgPath));
    if (pkg.name) {
      name = String(pkg.name).replace(/^@[^/]+\//, '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      note('found', `name from package.json: ${name}`);
    }
    if (pkg.description) {
      tagline = String(pkg.description);
      note('found', 'tagline from package.json description');
    }
  } catch {
    note('guess', 'package.json present but unparseable');
  }
}

// <title> from an index.html.
const html = files.find((f) => /index\.html$/i.test(basename(f)));
if (html) {
  const src = read(html);
  const t = src.match(/<title>([^<]+)<\/title>/i);
  if (t && !name) {
    name = t[1].split(/[-|]/)[0].trim();
    note('found', `name from <title>: ${name}`);
  }
  const desc = src.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  if (desc && !tagline) {
    tagline = desc[1].trim();
    note('found', 'tagline from meta description');
  }
}

// readme h1 / first line as a last resort for the tagline.
const readme = files.find((f) => /^readme\.md$/i.test(basename(f)));
if (readme) {
  const src = read(readme);
  const h1 = src.match(/^#\s+(.+)$/m);
  if (h1 && !name) {
    name = h1[1].replace(/[*_`]/g, '').trim();
    note('found', `name from README h1: ${name}`);
  }
  if (!tagline) {
    const tag = src.split('\n').map((l) => l.trim()).find((l) => l.startsWith('>') || /^\*\*.+\*\*$/.test(l));
    if (tag) {
      tagline = tag.replace(/^>|\*/g, '').trim();
      note('found', 'tagline from README');
    }
  }
}

if (!name) {
  name = basename(root) === '.' || !basename(root) ? 'Your App' : basename(root).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  note('guess', `name fell back to directory: ${name}`);
}
if (!tagline) {
  tagline = 'The fastest way to get it done.';
  note('guess', 'tagline guessed; please replace with your real one-liner');
}

// ---- assemble the colour palette ----
// detect whether the source skews dark or light to pick sensible ink/bg.
const bgPick =
  pickProp([/^(color-)?bg$/, /background$/, /^bg-(base|default|primary)$/, /surface-0/, /^body-bg$/]) ||
  pickTailwind(['background', 'bg', 'base', 'surface']);
const accentPick =
  pickProp([/^(color-)?(primary|brand|accent)$/, /primary-?\d?00?$/, /brand/, /accent/]) ||
  pickTailwind(['primary', 'brand', 'accent']);
const inkPick =
  pickProp([/^(color-)?(ink|fg|text|foreground)$/, /text-(primary|base|default)/]) ||
  pickTailwind(['foreground', 'text', 'ink', 'content']);

const accent2Pick = pickProp([/secondary/, /accent-?2/, /info/]) || pickTailwind(['secondary', 'info']);
const accent3Pick = pickProp([/tertiary/, /accent-?3/, /teal|cyan|mint/]) || pickTailwind(['tertiary', 'accent-3', 'teal', 'cyan']);
const goodPick = pickProp([/success/, /good/, /positive/, /green/]) || pickTailwind(['success', 'green', 'positive']);

// dark defaults (match the kit's cinematic look); overridden by anything found.
const palette = {
  bg: bgPick?.value ?? '#0b0d12',
  surface: '#14171f',
  surfaceEdge: '#242935',
  ink: inkPick?.value ?? '#f3f5f9',
  inkMuted: 'rgba(243,245,249,0.62)',
  inkFaint: 'rgba(243,245,249,0.34)',
  accent: accentPick?.value ?? '#6ea8fe',
  accent2: accent2Pick?.value ?? '#9b87f5',
  accent3: accent3Pick?.value ?? '#5eead4',
  good: goodPick?.value ?? '#86efac',
};

if (bgPick) note('found', `bg from --${bgPick.name}: ${bgPick.value}`);
else note('guess', 'bg not found; using the kit dark default');
if (accentPick) note('found', `accent from --${accentPick.name}: ${accentPick.value}`);
else note('guess', 'accent not found; using a default blue (set brand.accent to your colour)');
if (inkPick) note('found', `ink from --${inkPick.name}: ${inkPick.value}`);
else note('guess', 'ink not found; using near-white');
if (!accent2Pick) note('guess', 'accent2 guessed');
if (!accent3Pick) note('guess', 'accent3 guessed');
note('guess', 'surface / surfaceEdge / inkMuted / inkFaint derived for the dark stage; tweak if your brand is light');

// ---- font entries for the config (only those with a usable url) ----
const fontEntries = [];
for (const f of fonts) {
  if (f.url) {
    // keep absolute urls; bare/relative urls become public/ paths by basename.
    const url = /^(https?:)?\/\//.test(f.url) ? f.url : `fonts/${basename(f.url)}`;
    fontEntries.push({ family: f.family, url });
  }
}
for (const fam of googleFamilies) {
  // a google-font family with no concrete url: leave a note rather than a dead url.
  if (!fontEntries.some((e) => e.family === fam)) {
    note('guess', `google font "${fam}" detected but no woff2 url resolved; add a brand.fonts url or self-host into public/fonts/`);
  }
}

const brand = {
  name,
  tagline,
  bg: palette.bg,
  surface: palette.surface,
  surfaceEdge: palette.surfaceEdge,
  ink: palette.ink,
  inkMuted: palette.inkMuted,
  inkFaint: palette.inkFaint,
  accent: palette.accent,
  accent2: palette.accent2,
  accent3: palette.accent3,
  good: palette.good,
  fontDisplay,
  fontText,
};
if (fontEntries.length) brand.fonts = fontEntries;
if (logo) brand.logo = logo;

// ---- output ----
if (mergeFile && existsSync(mergeFile)) {
  let cfg = {};
  try {
    cfg = JSON.parse(read(mergeFile));
  } catch {
    note('guess', `--merge target ${mergeFile} unparseable; printing brand only`);
  }
  cfg.brand = brand;
  process.stdout.write(JSON.stringify(cfg, null, 2) + '\n');
} else {
  process.stdout.write(JSON.stringify({ brand }, null, 2) + '\n');
}

if (!jsonOnly) {
  process.stderr.write('\nbrand extraction notes:\n');
  for (const n of notes) process.stderr.write('  ' + n + '\n');
  process.stderr.write(
    '\nreview the [guess] lines above. colours/fonts/logo/name/tagline that were guessed\n' +
      'should be confirmed against the product before rendering.\n',
  );
}
