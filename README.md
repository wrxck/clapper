# Clapper

**Turn any repo into a rich, brand-matched promo video — as a Claude skill.**

Clapper scaffolds a config-driven [Remotion](https://www.remotion.dev) + `ffmpeg`
pipeline into your project, **inherits your product's brand** (colours, fonts,
logo, name, feature copy) straight from the codebase, and renders polished promo
films in every social aspect ratio — 16:9, 9:16, 1:1, 4:5 — plus poster frames.
A live in-browser editor lets you fine-tune copy, timing, scenes and colours with
instant preview.

It ships as a Claude Code **plugin** containing one skill (`promo-video`): ask
Claude *"make a promo video for this app"* and it does the rest.

---

## What you get

- **Brand inheritance** — a deterministic extractor reads your CSS custom
  properties / Tailwind theme, `@font-face` + Google-font links, the logo
  (SVG/favicon) and app name/tagline; Claude fills the gaps and writes the
  feature copy from your repo. The video looks like *your* product, automatically.
- **One timeline, every format** — scenes are written once and adapt to each
  aspect ratio via a short-edge unit (`u`), so 16:9 / 9:16 / 1:1 / 4:5 all come
  from the same source. Add or remove formats in config.
- **Cinematic by default** — kinetic typography, spring-eased motion, a film-grain
  + vignette stage, device mockups that frame your real screenshots, animated
  stats and charts.
- **A live tuning UI** — `npm run ui` opens a browser editor: a form for every
  knob on the left, a live `@remotion/player` preview on the right.
- **Deterministic output** — `ffmpeg` encodes per-platform deliverables with the
  right pixel format, faststart, bitrate caps and poster frames; optional music
  is mixed under every cut with a tail fade.

## Install (as a Claude plugin)

```
/plugin marketplace add wrxck/clapper
/plugin install clapper@clapper
```

Or drop the skill straight into a project: copy `skills/promo-video/` into your
repo's `.claude/skills/`.

## Use

In any repo, just ask Claude:

> Make a promo video for this app.

The `promo-video` skill will: detect your stack → extract your brand → scaffold a
`promo/` folder → write a script from your features → render the formats →
hand you the deliverables. Then iterate: *"make it punchier, lead with the coach
feature, add our brand teal"* — or open the live editor.

### Manually

```bash
cd promo
npm install
npm run ui        # live editor at http://localhost:5173
npm run studio    # remotion studio (timeline + props)
npm run render    # render every format -> out/deliverables/
```

## Prerequisites

- Node.js 20+
- `ffmpeg` on PATH (`brew install ffmpeg` / `apt install ffmpeg`)
- Chrome/Chromium is fetched by Remotion on first render

## How it works

```
your-repo/
  promo/                      (scaffolded by the skill)
    clapper.config.json       brand + script (the data you tune)
    public/                   your logo, screenshots, optional music.m4a
    src/                      the Remotion film (scenes adapt to every format)
```

`clapper.config.json` is the single source of truth: `brand` (tokens, fonts,
logo) + `scenes` (an ordered list of typed beats — `title`, `device`, `features`,
`stat`, `bullets`, `pricing`, `cta`). Editing it — by hand, via the UI, or by
asking Claude — is the whole workflow.

See the skill docs for detail:
[brand extraction](skills/promo-video/references/brand-extraction.md) ·
[scene catalogue](skills/promo-video/references/scenes.md) ·
[render profiles](skills/promo-video/references/render-profiles.md) ·
[the tuning UI](skills/promo-video/references/ui.md) ·
[CI rendering](skills/promo-video/references/ci.md).

## Status

v0.1 — private preview. Reviewing before public release. See [CHANGELOG](CHANGELOG.md).

## Licence

MIT © Matt Hesketh
