# public assets

Remotion serves this folder at the site root. Drop in:

- **screenshots** for `device` scenes (reference them by filename in
  `clapper.config.json`, e.g. `"image": "today.png"`).
- a **logo** image if `brand.logo.type` is `"image"` (e.g. `"src": "logo.svg"`).
- **fonts** under `public/fonts/` if you self-host instead of using a remote
  webfont url (reference as `"url": "fonts/inter.woff2"` in `brand.fonts`).
- optional **`music.m4a`** (or `music.mp3`) — `render.sh` mixes it under every
  deliverable with a tail fade-out.

Absolute `http(s)` urls in the config are used as-is; bare paths are resolved
against this folder with Remotion's `staticFile`.
