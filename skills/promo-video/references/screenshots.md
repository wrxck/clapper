# App screenshots for device scenes

A `device` scene shows a real app screen when you give it an `image`. The
optional `template/scripts/capture-screens.mjs` helper grabs one from a live URL
at phone resolution and drops it into `public/`.

## Run it

```bash
# screenshot a page into public/screen.png at iphone-ish resolution
node scripts/capture-screens.mjs https://app.example.com screen.png

# custom viewport / full page / extra settle time
node scripts/capture-screens.mjs https://app.example.com home.png --width=414 --height=896 --full --wait=1500
```

Then reference it from a scene:

```json
{ "type": "device", "durSec": 6, "frame": "phone", "image": "screen.png", "headline": "Your day, planned." }
```

## Playwright is optional, not a dependency

The helper does **not** add Playwright to `package.json`. It invokes Playwright
through `npx --no-install`, and if Playwright is not present it prints guidance
and **exits 0** (so it never breaks a build or a speculative CI step):

```
npx playwright install chromium
```

Install that once, then re-run the helper.

## Defaults

| Flag | Default | Meaning |
| --- | --- | --- |
| width | 390 | viewport css width (iphone-ish) |
| height | 844 | viewport css height |
| `--full` | off | capture the full scrollable page, not just the viewport |
| `--wait` | 800 | extra settle time (ms) after `networkidle` |

The capture uses `deviceScaleFactor: 2` and `isMobile`, so you get a crisp 2x
shot that holds up inside the phone frame. The file lands in `public/` ready for
a scene's `image`.

## Tips

- Capture the exact screen you want on camera; the phone frame crops to
  `object-fit: cover` from the top, so lead with the hero content.
- For a browser scene use a wider viewport (e.g. `--width=1280 --height=800`)
  and set the scene `frame` to `browser`.
- Authenticated screens: capture them yourself and drop the PNG into `public/`
  directly - the helper only handles a plain public URL.
