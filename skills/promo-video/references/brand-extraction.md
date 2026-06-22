# Brand extraction

`scripts/extract-brand.mjs` reads a target repo and emits a `brand` object that
matches `template/src/schema.ts`. It is heuristic and resilient: it never throws
on a repo it does not understand, it guesses sensible defaults and tells you what
it guessed.

## Run it

```bash
# print just the brand object (notes go to stderr):
node scripts/extract-brand.mjs <repo-root>

# merge the brand into an existing config and print the whole config:
node scripts/extract-brand.mjs <repo-root> --merge promo/clapper.config.json > /tmp/c.json
mv /tmp/c.json promo/clapper.config.json

# machine-readable only (suppress the notes):
node scripts/extract-brand.mjs <repo-root> --json
```

Zero dependencies (Node stdlib only). It walks the repo (skipping
`node_modules`, `.git`, build dirs), capped for speed.

## What it looks for

| Token | Sources, in order of preference |
| --- | --- |
| `name` | `package.json` name, `<title>`, README h1, then the directory name |
| `tagline` | `package.json` description, `<meta name=description>`, README blockquote |
| `bg` | CSS `--bg` / `--background` / `--body-bg`, Tailwind `background`/`base` |
| `ink` | CSS `--ink` / `--fg` / `--text` / `--foreground`, Tailwind `foreground` |
| `accent` | CSS `--primary` / `--brand` / `--accent`, Tailwind `primary`/`brand` |
| `accent2/3`, `good` | secondary / tertiary / success families if present |
| `fonts` | `@font-face` families (with `url()`), Google-fonts `family=` links |
| `fontDisplay/Text` | first two distinct families found |
| `logo` | an SVG/PNG named like a logo under `public/`/`static`/`assets`, or favicon |

CSS custom properties are resolved through one level of `var()` indirection, and
the most-referenced tokens are preferred (real brand tokens get used a lot).
Tailwind v4 `@theme { --color-* }` blocks and classic `tailwind.config.*` colour
maps are both parsed.

## Logo handling

- An **SVG with <= 8 `<path d="...">`** becomes `logo: { type: "paths", src: [...] }`
  — the paths draw on with a stroke-dash reveal (the `Mark` component). This is
  the nicest result; it animates.
- Anything else becomes `logo: { type: "image", src: "<basename>" }`. **Copy the
  file into `promo/public/`** so Remotion can serve it.
- No logo found: the film draws the brand initial in a rounded tile as a
  fallback — still clean, no broken asset.

## Fonts: the one manual step that usually matters

`@font-face` rules with a `url()` are emitted as `brand.fonts` entries (absolute
URLs kept; bare paths rewritten to `fonts/<basename>` — **self-host them under
`promo/public/fonts/`**). Google-fonts `<link>` families are detected but a
stable woff2 URL often cannot be resolved from the link alone, so the script
leaves a note instead of a dead URL. To fix:

- self-host: download the woff2 into `promo/public/fonts/` and set
  `brand.fonts[].url` to `fonts/<file>.woff2` (most reliable, works offline), or
- point `url` at a current `https://fonts.gstatic.com/...woff2` you have verified
  resolves (gstatic hashes are versioned and can change — verify before relying
  on one).

The font loader degrades gracefully: a 404 just renders with the fallback stack,
it never blocks the render (`delayRender` is always released).

## Always do this afterwards

Read the `[guess]` lines. Open the repo and confirm the palette and the logo look
right — the accent in particular, since a near-black `--accent` is a valid token
but a poor glow colour. The video inherits everything from `brand`, so fixing it
here fixes the whole film.
