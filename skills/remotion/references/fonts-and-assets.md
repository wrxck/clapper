# Fonts and assets

Rendering captures each frame the moment React commits, so anything that loads
asynchronously (web fonts, remote images, data) can be missing on the first frames
unless you tell Remotion to wait. That is what `delayRender`/`continueRender` are
for.

## delayRender and continueRender

`delayRender()` returns a handle and blocks the renderer (and the Studio's "ready"
state) until you call `continueRender(handle)`. Always pair them, always continue
in both success and error paths, or the render hangs until timeout.

```tsx
import { delayRender, continueRender, cancelRender } from "remotion";
import { useEffect, useState } from "react";

const [handle] = useState(() => delayRender("loading data"));

useEffect(() => {
  fetch("https://api.example.com/stats")
    .then((r) => r.json())
    .then(() => continueRender(handle))
    .catch((e) => cancelRender(e)); // fail fast instead of timing out
}, [handle]);
```

- Give `delayRender` a label; it appears in timeout errors and aids debugging.
- The default timeout is 30s; raise it with the `timeoutInMilliseconds` option or
  the `--timeout` CLI flag for slow loads.
- `cancelRender(error)` aborts the whole render with a useful message; prefer it to
  swallowing errors.

## Fonts: @remotion/google-fonts (preferred)

The typed Google Fonts package handles loading and the delayRender dance for you.

```tsx
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily, waitUntilDone } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

// optionally block rendering until the font is ready
// await waitUntilDone();   // e.g. in calculateMetadata

export const Heading: React.FC = () => (
  <h1 style={{ fontFamily, fontWeight: 700 }}>Sharp text</h1>
);
```

Import the specific font module (`@remotion/google-fonts/Roboto`, etc.). Using
`fontFamily` returned by `loadFont` guarantees the exact name.

## Fonts: local files with the FontFace API

For a custom or self-hosted font, load it explicitly and gate rendering on it:

```tsx
import { staticFile, delayRender, continueRender } from "remotion";
import { useState, useEffect } from "react";

const [handle] = useState(() => delayRender("custom font"));

useEffect(() => {
  const font = new FontFace("Brand", `url(${staticFile("Brand.woff2")})`);
  font.load().then((loaded) => {
    document.fonts.add(loaded);
    continueRender(handle);
  });
}, [handle]);
```

`@remotion/fonts` also offers a `loadFont` helper for local files that wraps this.

## staticFile and the public/ folder

Put assets (images, video, audio, fonts, JSON) in `public/` at the project root.
Reference them with `staticFile("name.ext")`, never with a raw relative path or a
hardcoded `/` URL, so paths resolve correctly in the Studio and in renders.

```tsx
import { Img, staticFile, Audio } from "remotion";

<Img src={staticFile("logo.svg")} />
<Audio src={staticFile("music.m4a")} />
```

- Subfolders are fine: `staticFile("screens/dashboard.png")`. Use forward slashes.
- Use Remotion's `<Img>` (not the DOM `<img>`); it integrates with delayRender so
  images are guaranteed loaded before the frame is captured.
- For video assets prefer `<OffthreadVideo>`; for audio use `<Audio>`.
- Remote URLs work too, but wrap manual fetches in delayRender, and remember remote
  hosts must be reachable from the render environment (and from Lambda if used).

## A note on determinism

Keep asset loading deterministic: a fixed file in `public/`, or a fetch that
returns the same data, will render identically every time. Anything that varies
per call (random APIs, time-based endpoints) breaks reproducibility the same way
`Math.random()` does (see animation.md).
