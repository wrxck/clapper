# Quality review — the self-check loop

The single biggest lever for *consistent* output is to look at the frames before
committing to a full render, the same way a person would. Do this every time,
between writing `clapper.config.json` and the final `npm run render`.

## The loop

1. **Render representative stills** (cheap — one frame per scene, no encode):

   ```bash
   cd promo && npm run stills          # writes out/stills/<format>/<scene>.png
   ```

   It samples the mid-point of each scene for the required format (default the
   9:16 vertical, since that is the tightest) and, when more than one format is
   configured, also the 16:9.

2. **Look at every still** (you are multimodal — actually read the images) and
   score each against the rubric below. Do not skip this; it is the step that
   turns "render and hope" into a reliable result.

3. **Fix the config** for anything that fails, then re-run `npm run stills` and
   re-check. Only when the stills pass do you run the full `npm run render`.

## The rubric

For each still, check:

- **Legibility** — is every word comfortably readable at a glance? No text
  smaller than ~3.2% of the short edge for body, ~6% for headlines.
- **Contrast** — does text clear WCAG AA against what sits behind it (>= 4.5:1
  for body, >= 3:1 for large text)? Watch text over the device screenshot and
  over glows.
- **Safe area** — is nothing important inside the platform-UI danger zones?
  Bottom ~18% and right ~12% on 9:16 (TikTok/Reels caption + action rail), top
  ~10% for status. Keep headlines and the logo out of these bands.
- **Overflow / clipping** — no word broken oddly, no element off-canvas, no card
  taller than the frame, no overlap between text and the device.
- **Hierarchy** — one clear focal point per scene; the eye knows where to land.
- **Brand match** — does it look like the product (colours, type, logo), not a
  generic template? If the palette feels off, fix `brand` first.
- **Captions present** — for muted viewing, the spoken/headline message is
  legible on screen (see the `caption` field in [scenes.md](scenes.md)).
- **Real product on the product beat** — the `device` scene is the heart of the
  promo (see [scriptwriting.md](scriptwriting.md)). If it renders the built-in
  synthetic dashboard instead of an actual screenshot of *this* app, flag it:
  "product beat is the synthetic dashboard, not a real screenshot". That happens
  when `frame: "dashboard"` with no `image`, or when `promo/public/` has no
  screenshots to point at. Fix it before rendering — drop a real capture into
  `promo/public/` and set `frame: "phone"` (or `"browser"`) with
  `image: "<file>.png"`. The synthetic dashboard is a scaffolding placeholder
  only; shipping it means the film never actually shows the product.

## Brand preview (do this once, up front)

Before scripting, render and look at a single brand card:

```bash
cd promo && npm run stills -- --brand-only
```

Confirm the extracted palette, fonts and logo actually read well together
(contrast, not muddy, fonts loaded — not a system fallback). Fixing `brand`
before composing scenes means every scene inherits a good base.

## Why stills, not a full render

A still is ~1 frame and needs no ffmpeg encode, so the loop is seconds, not
minutes. The expensive full render only ever runs against config you have already
eyeballed.
