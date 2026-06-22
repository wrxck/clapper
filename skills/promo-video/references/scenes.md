# Scene catalogue

`clapper.config.json` is the single source of truth. `scenes` is an ordered array
of typed beats; each beat is `{ type, durSec, glow?, ...props }`. The film lays
them on one timeline (each `durSec` becomes a frame span) and every format renders
the same scenes — they adapt to the aspect ratio via the short-edge unit `u`, so
you never write per-format scene code.

The full shape is `template/src/schema.ts` (Zod) — it validates the config, types
the Remotion composition, and is shared by the tuning UI. If the config parses,
it renders.

## Common fields

- `durSec` (required) — seconds on screen. Total film length is the sum.
- `glow` (optional) — a translucent colour for the stage's drifting radial glow,
  e.g. `"rgba(110,168,254,0.10)"`. Keep alpha low (0.05–0.12); it is a tint, not
  a fill. Defaults to a faint white.

## Archetypes

### `title`
Kinetic words that rise, de-blur and settle, optionally over the logo mark.

```json
{ "type": "title", "durSec": 3.2, "showLogo": true,
  "words": ["Deep", "work,", "without", "the", "willpower."], "sub": "optional line" }
```
`words[]` (each word staggers in), `sub?`, `showLogo?`.

### `bullets`
An icon + line list, each row settling in on a stagger. Good for values/privacy.

```json
{ "type": "bullets", "durSec": 5.2, "heading": "Yours, and only yours.",
  "items": [ { "icon": "lock", "line": "Encrypted, end to end." } ] }
```
`heading?`, `items[]` of `{ icon, line }`.

### `features`
A responsive grid of cards (row on wide/square, column on portrait), each card
popping in: an icon tile (tinted by the rotating accent palette), a title and a
description.

```json
{ "type": "features", "durSec": 5.6, "heading": "Built to keep you in flow.",
  "cards": [ { "icon": "bolt", "title": "Auto-blocking", "desc": "..." } ] }
```
`heading?`, `cards[]` of `{ icon, title, desc }`. Three cards reads best.

### `device`
A frame around a product screenshot (or a built-in dashboard), with a caption and
a slow tilt/parallax. The frame works for **any** app via a screenshot.

```json
{ "type": "device", "durSec": 6, "frame": "phone",
  "image": "today.png", "caption": "Your day, planned for you.", "sub": "..." }
```
- `frame`: `"phone"` | `"browser"` | `"dashboard"`.
- `image?`: a file in `promo/public/` (or an absolute URL). Omit it with
  `frame: "dashboard"` to render the built-in synthetic stat dashboard (a ring
  counting up + filling metric bars) — useful before you have screenshots.
- `caption?`, `sub?`. On wide it lays out side-by-side; portrait/square and
  `browser` stack the caption above the frame.

### `stat`
One big animated counter and a label. Supports prefix/suffix and decimals.

```json
{ "type": "stat", "durSec": 3.4, "value": 2.4, "decimals": 1, "suffix": "x",
  "label": "more deep-work hours in the first week" }
```
`value`, `prefix?`, `suffix?`, `decimals?` (0–3), `label`.

### `pricing`
A price hit with an optional period and a kinetic sub-line.

```json
{ "type": "pricing", "durSec": 3, "price": "Free", "period": "for 14 days",
  "sub": "Then 6 pounds a month, cancel anytime." }
```
`price`, `period?`, `sub?`.

### `cta`
The closing card: logo, wordmark, a URL pill, and a closing line.

```json
{ "type": "cta", "durSec": 3.6, "showLogo": true, "url": "driftwell.app",
  "line": "Start your first deep-work session today." }
```
`url`, `line?`, `showLogo?` (default true).

## Icons

`icon` fields accept one of the inline-SVG icon names (no font, no emoji):

`check` · `lock` · `bolt` · `cloud` · `chart` · `shield` · `eye-off` ·
`sparkle` · `star` · `heart` · `globe` · `device`

To add one: add the name to `iconNameSchema` in `schema.ts` and a matching path
entry in `template/src/components/Icons.tsx`.

## Writing a good script

Aim for ~30–45s, 7–9 beats. A reliable arc:

1. `title` with the name + tagline (logo on).
2. `title` — the one-line hook.
3. `device` — show the product (real screenshot beats the dashboard).
4. `features` — three cards, the core capabilities.
5. `stat` — a proof point.
6. `bullets` — values / privacy / what makes it trustworthy.
7. `pricing`.
8. `cta`.

Keep copy short and concrete. Lead with the single most compelling thing.
