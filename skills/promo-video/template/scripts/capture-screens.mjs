#!/usr/bin/env node
// capture-screens: an optional helper that screenshots a live url at phone
// resolution into public/, so a `device` scene can show a real app screen. it is
// deliberately dependency-free in this package: it invokes playwright via npx and,
// if playwright is not installed, prints install guidance and exits 0 (so it never
// breaks a build or a ci step that runs it speculatively).
//
// usage:
//   node scripts/capture-screens.mjs <url> [outfile] [--width=W] [--height=H] [--full]
//
//   <url>           the page to screenshot (e.g. https://app.example.com)
//   [outfile]       filename under public/ (default: screen.png)
//   --width=W       viewport width in css px (default: 390, iphone-ish)
//   --height=H      viewport height in css px (default: 844)
//   --full          capture the full scrollable page rather than the viewport
//   --wait=MS       extra settle time after load (default: 800)
//
// the actual capture runs in a tiny inline playwright script through npx, so this
// repo carries no playwright dependency. the screenshot lands in public/ ready to
// reference from a device scene's `image`.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const args = process.argv.slice(2);
const flag = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};
const positional = args.filter((a) => !a.startsWith('--'));

const url = positional[0];
if (!url) {
  process.stderr.write('usage: node scripts/capture-screens.mjs <url> [outfile] [--width=] [--height=] [--full] [--wait=]\n');
  process.exit(1);
}

const outName = positional[1] ?? 'screen.png';
const width = Number(flag('width', '390')) || 390;
const height = Number(flag('height', '844')) || 844;
const wait = Number(flag('wait', '800')) || 800;
const full = args.includes('--full');

const publicDir = join(root, 'public');
mkdirSync(publicDir, { recursive: true });
const outPath = isAbsolute(outName) ? outName : join(publicDir, outName);

// detect playwright without adding it as a dependency: ask npx to resolve it.
// `npx --no-install` returns non-zero if the package is not already available.
const probe = spawnSync('npx', ['--no-install', 'playwright', '--version'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'ignore'],
  env: process.env,
});

if (probe.status !== 0) {
  process.stdout.write(
    [
      'capture-screens: playwright is not installed.',
      'this helper is optional and does not ship as a dependency.',
      'to use it, install the browser once:',
      '',
      '  npx playwright install chromium',
      '',
      'then re-run:',
      `  node scripts/capture-screens.mjs ${url} ${outName}`,
      '',
    ].join('\n'),
  );
  // exit 0 on purpose: absence of an optional tool is not a failure.
  process.exit(0);
}

// inline capture script run through node with playwright resolved from npx's env.
const script = `
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: ${width}, height: ${height} },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const page = await ctx.newPage();
  await page.goto(${JSON.stringify(url)}, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(${wait});
  await page.screenshot({ path: ${JSON.stringify(outPath)}, fullPage: ${full ? 'true' : 'false'} });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
`;

const run = spawnSync('npx', ['--no-install', 'node', '-e', script], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

if (run.status !== 0) {
  process.stderr.write(`capture-screens: capture failed (exit ${run.status ?? 'signal'})\n`);
  process.exit(run.status || 1);
}

if (!existsSync(outPath)) {
  process.stderr.write('capture-screens: no file was written\n');
  process.exit(1);
}

process.stdout.write(`capture-screens: wrote ${outPath}\nreference it from a device scene as "image": "${outName}"\n`);
