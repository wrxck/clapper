# The tuning UI

A small Vite + React app under `template/ui/` that edits the config with a live
preview. Left panel: a form for every knob. Right panel: a `@remotion/player`
preview bound to the same state, a format switcher, and Export / Copy.

## Run

```bash
cd promo
npm run ui            # vite dev server, opens http://localhost:5173
```

Build it (e.g. to host the editor) with `npm run ui:build` (outputs `ui/dist/`).

## How it is wired

- The UI imports the **real** `Film`, the `timeline` helper and the Zod `schema`
  from `../src`, and the starter `clapper.config.json`. So the preview is the
  actual film, and the form can never offer a value the film cannot render (the
  icon list, the frame options and the scene types all come from the schema
  enums).
- One `config` object in React state drives both panes. Editing a field re-renders
  the `<Player>` immediately — what you tune is what you render.
- Vite serves the project's `public/` folder, so screenshots and the logo show in
  the live preview exactly as in a real render.

## What you can edit

- **Brand** — name, tagline, the two font families, and every colour token (a
  native colour picker plus a text box that keeps the exact value, so `rgba()` and
  `oklch()` tokens survive the picker's hex-only round-trip).
- **Timeline** — `fps`, and per scene: duration, glow, and all of that scene
  type's fields. Reorder (up / down), remove, and add scenes (pick a type, then
  "add scene" inserts a sensible blank).
- **Format switcher** — preview any configured aspect ratio; the player resizes to
  it. The header shows scene count and total length.

## Export

- **Export clapper.config.json** downloads the edited config. Drop it into
  `promo/` (replacing the existing one) and `npm run render`.
- **Copy json** puts the same JSON on the clipboard.

The editor and `clapper.config.json` are the same data in two forms — editing by
hand, in the UI, or by asking Claude are interchangeable. The UI does not write to
disk itself (browsers cannot), hence Export.

## Notes

- The preview uses the browser's own font rendering; a remote `brand.fonts` URL
  must be reachable for the preview to show that face (self-hosted `public/fonts/`
  files always work). A missing font just falls back — same as a render.
- The Player is for tuning, not final output. Always `npm run render` for the
  encoded, faststart deliverables.
