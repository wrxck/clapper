# Render profiles

`template/render.sh` renders every composition in `clapper.config.json` to a
high-quality master, then encodes a per-platform deliverable with `ffmpeg` plus a
poster frame. The format list is read straight from the config (via a tiny inline
Node helper, no `jq` needed), so deliverables always match your configured
formats.

## Run

```bash
cd promo
npm run render        # = bash render.sh
```

Prerequisites: Node 20+, `ffmpeg` on PATH, and Chrome/Chromium (Remotion fetches
a headless build on first render).

## What it produces

```
promo/out/
  master/        <id>_<w>x<h>.mp4        h264 crf 16 (visually lossless master)
  deliverables/  <id>_<w>x<h>.mp4        encoded social deliverable
                 <id>_<w>x<h>_poster.jpg poster frame
```

## The two stages

1. **Master** — `remotion render ... --codec h264 --crf 16`. One per composition.
   High bitrate, the source for the encode step. Frames are JPEG (set in
   `remotion.config.ts`) for speed.

2. **Deliverable** — `ffmpeg` re-encodes the master for delivery:
   - `-pix_fmt yuv420p` (universal playback; without it Safari/Quicktime and many
     uploaders choke),
   - `-movflags +faststart` (moov atom up front, so it streams without a full
     download),
   - `-profile:v high -preset slow -crf 19` with a `-maxrate`/`-bufsize` cap.

   Bitrate cap is chosen by aspect: **wide 12M**, **square 8M**, **other
   (portrait/vertical) 10M**. Edit the `cap` logic in `render.sh` to retune.

Poster frames are grabbed at ~20% in (capped at 8.5s) at `-q:v 2`.

## Music (optional)

Drop `promo/public/music.m4a` (or `music.mp3`). When present it is mixed under
every deliverable and faded out over the final 1.5s
(`afade=t=out:st=<dur-1.5>:d=1.5`), `-shortest` so audio never outruns the video.
With no music file the deliverables are silent (`-an`).

## Rendering a single format

```bash
cd promo
npx remotion render src/index.ts Vertical out/vertical.mp4 --codec h264 --crf 16
```

The composition ids are the `formats[].id` values in your config (e.g. `Wide`,
`Vertical`, `Square`, `Portrait`). `npx remotion compositions src/index.ts` lists
them.

## Adding / removing formats

Edit `formats` in `clapper.config.json` — add `{ id, label, width, height }` or
remove an entry. `Root.tsx` registers one composition per entry and `render.sh`
iterates the same list; nothing else to touch.
