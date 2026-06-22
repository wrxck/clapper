# Changelog

All notable changes to Clapper are recorded here. This project follows
[semantic versioning](https://semver.org).

## [0.1.0] - unreleased (private preview)

First scaffold. Reviewing privately before the public release.

### Added
- Claude plugin shell: `.claude-plugin/plugin.json` + `marketplace.json`.
- **promo-video** skill: orchestrates brand extraction, scaffolding, scripting,
  rendering and iteration.
- **ffmpeg** skill: professional encoding, filters and social presets, with
  version and security discipline.
- **remotion** skill: compositions, animation, props/schema and rendering, with
  the Remotion company-licence callout and latest-secure-version guidance.
- Generic, config-driven Remotion template: one timeline, four aspect ratios
  (16:9, 9:16, 1:1, 4:5), reusable scene archetypes (title, bullets, features,
  device, stat, pricing, cta), inline-SVG icons, and an ffmpeg deliverable
  pipeline with poster frames and optional music.
- Brand extractor: reads CSS custom properties / Tailwind theme, fonts, logo and
  app name from a target repo.
- Custom in-browser tuning UI (Vite + @remotion/player): a form for every knob
  with a live preview.
