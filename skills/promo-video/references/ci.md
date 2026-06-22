# Rendering on CI

Rendering is deterministic, so it runs the same on a CI runner as on a laptop or a
self-hosted Mac. The pattern below renders every format and uploads the
deliverables as build artefacts. It mirrors how a self-hosted Mac renders (same
`npm run render`), just on a hosted Ubuntu runner.

## Requirements on the runner

- Node 20+.
- `ffmpeg` on PATH (`sudo apt-get install -y ffmpeg`).
- Chrome/Chromium for headless rendering. Remotion can fetch its own headless
  shell (`npx remotion browser ensure`), which is the simplest option on a clean
  runner. On Linux it also needs a few system libraries (libnss3, libatk, etc.).

Rendering is CPU-heavy. On hosted runners prefer a larger runner if available, and
expect a full multi-format render to take minutes.

## Example workflow

`.github/workflows/promo-video.yml`:

```yaml
name: promo-video

on:
  workflow_dispatch:
  push:
    paths:
      - 'promo/clapper.config.json'
      - 'promo/src/**'

jobs:
  render:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    defaults:
      run:
        working-directory: promo
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: promo/package-lock.json

      - name: install ffmpeg
        run: sudo apt-get update && sudo apt-get install -y ffmpeg

      - name: install deps
        run: npm ci

      - name: install chromium for remotion
        run: |
          sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 \
            libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
            libxrandr2 libgbm1 libpango-1.0-0 libasound2t64
          npx remotion browser ensure

      - name: typecheck
        run: npm run typecheck

      - name: render
        run: npm run render

      - uses: actions/upload-artifact@v4
        with:
          name: promo-deliverables
          path: |
            promo/out/deliverables/*.mp4
            promo/out/deliverables/*_poster.jpg
          if-no-found: error
          retention-days: 14
```

## Self-hosted Mac

The same job runs on a self-hosted macOS runner: drop `runs-on: ubuntu-latest` for
your runner label and remove the `apt-get` steps (install `ffmpeg` once via
`brew install ffmpeg`; Remotion fetches its headless shell on first render). This
matches a local render exactly.

## Caching the headless shell

Remotion caches its headless shell under the home directory; cache it between runs
to skip the ~90 MB download:

```yaml
      - uses: actions/cache@v4
        with:
          path: ~/.cache/remotion
          key: remotion-browser-${{ runner.os }}
```

## Music and screenshots

`render.sh` mixes `promo/public/music.m4a` if present and reads screenshots from
`promo/public/`. Commit those assets (or fetch them in a prior step) so the runner
has them. Large binaries are better fetched from a release/bucket than committed.
