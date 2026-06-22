---
name: promo-video
description: >-
  Create a polished, brand-matched promo video for the current repo. Use when the
  user asks for a promo/launch/marketing/trailer/social video, app teaser, or
  "show off this project as a video". Extracts the repo's brand (colours, fonts,
  logo, name, feature copy), scaffolds a config-driven Remotion + ffmpeg pipeline,
  and renders multiple aspect ratios (16:9, 9:16, 1:1, 4:5) plus poster frames,
  with a live in-browser editor for fine-tuning.
---

# promo-video

Turn the current repo into a rich promo film whose look is taken from the product
itself. The pipeline is config-driven Remotion (one timeline, many aspect ratios)
encoded to social deliverables with ffmpeg.

This skill orchestrates; two sibling skills do the specialist work and are worth
reading when you touch their areas:

- **remotion** — composition, animation, props/schema, rendering, the Remotion
  company licence, and verifying the latest secure version. Read it before editing
  anything under `src/` or changing render flags.
- **ffmpeg** — encoding, filters, social presets, and ffmpeg version/security
  discipline. Read it before changing `render.sh` or any encode command.

## The workflow

Work through these steps. Prefer the bundled scripts for the deterministic parts;
use judgement for the brand extraction and the script (the copy and scene order).

1. **Check prerequisites.** Node 20+ and `ffmpeg` on PATH (`ffmpeg -version`). If
   ffmpeg is missing, point the user at the install note in the `ffmpeg` skill.

2. **Extract the brand.** Run the extractor against the repo root:

   ```bash
   node scripts/extract-brand.mjs <repo-root> > /tmp/clapper-brand.json
   ```

   It finds CSS custom properties / Tailwind theme colours, fonts
   (`@font-face` + Google-font links), the logo (SVG / favicon) and the app
   name/tagline, and prints a `brand` object plus notes on what was found vs
   guessed. Then **read the repo yourself** to fill the gaps the script flags and
   to confirm the palette looks right. The extractor picks text colours that pass
   WCAG contrast on the chosen background and verifies the fonts actually load
   (not a fallback). Render a one-off **brand preview** and look at it before
   scripting — `cd promo && npm run stills -- --brand-only`. See
   [references/brand-extraction.md](references/brand-extraction.md) and
   [references/quality-review.md](references/quality-review.md).

3. **Scaffold the project.** Copy the template into the repo and install:

   ```bash
   bash scripts/scaffold.sh <repo-root>
   ```

   This creates `<repo-root>/promo/` (the Remotion project + the tuning UI) and
   runs `npm install` there.

4. **Write `promo/clapper.config.json`.** Merge the extracted `brand` in, then
   compose the `scenes` — an ordered list of typed beats. Read the repo's
   README, marketing copy, feature list and screenshots and turn them into a
   tight story. **Follow the story framework + copy rules in
   [references/scriptwriting.md](references/scriptwriting.md)** — hook, tension,
   product, proof, values, price, CTA — and **run its critic pass** before
   rendering (the difference between a generic template and a promo worth
   watching). Give every scene a short `caption` so the message lands with the
   sound off. The scene archetypes and every field are in
   [references/scenes.md](references/scenes.md). Drop screenshots, the logo and an
   optional `music.m4a` into `promo/public/` — music is mixed in and
   loudness-normalised at render.

5. **Preview + fine-tune.** Offer the live editor or Studio:

   ```bash
   cd promo && npm run ui       # browser editor with live preview
   cd promo && npm run studio   # remotion studio
   ```

   The editor reads/writes `clapper.config.json`, so changes there and changes the
   user makes in the UI are the same data. See [references/ui.md](references/ui.md).

6. **Quality review (required before rendering).** First lint the config
   (`cd promo && npm run lint`) to catch the mechanical smells — a `stat` with
   `value: 0` or a sentence label, a `device` beat still on the synthetic
   dashboard, a spelled-out currency or over-long pricing sub, and a theme that
   repeats across beats. Then render cheap stills and actually look at them — this
   is the main lever for consistent, professional output. Run
   `cd promo && npm run stills`, then inspect every frame against the rubric in
   [references/quality-review.md](references/quality-review.md) (legibility,
   contrast, platform safe areas, overflow, hierarchy, brand match, captions, and
   that the product beat shows a real screenshot, not the dashboard). A review
   round that surfaces nothing is a signal the review did not run — re-run it
   rather than treating empty as a pass. Fix `clapper.config.json` for anything
   that fails and re-run. Only render once the stills pass.

7. **Render the deliverables.**

   ```bash
   cd promo && npm run render
   ```

   Outputs every configured format plus poster frames to
   `promo/out/deliverables/`. Formats, bitrates and the music mix are covered in
   [references/render-profiles.md](references/render-profiles.md). For rendering on
   CI instead of locally, see [references/ci.md](references/ci.md).

8. **Iterate.** Most changes are edits to `clapper.config.json` (copy, timing,
   colours, scene order, which formats) followed by another `npm run render`. Only
   reach into `src/` for new motion or a new scene type — and read the `remotion`
   skill first.

## Notes

- The video should *look like the product*. If the extracted palette or logo is
  off, fix `brand` before composing scenes — everything inherits from it.
- Keep copy short and concrete. Lead with the single most compelling thing the
  product does.
- `clapper.config.json` is the single source of truth; never hand-edit the
  rendered output or duplicate config into `src/`.
- Respect the Remotion licence (see the `remotion` skill) and keep ffmpeg current
  (see the `ffmpeg` skill).
