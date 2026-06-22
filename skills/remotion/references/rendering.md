# Rendering

Rendering turns a composition into a file. The CLI renders locally in headless
Chrome; `@remotion/lambda` and `@remotion/cloudrun` render in the cloud. The Studio
is for authoring and triggering renders interactively.

## remotion render

```
npx remotion render <composition-id> <output> [flags]
npx remotion render MyVideo out/video.mp4
```

If you omit the id, Remotion prompts (or renders the only composition). If you omit
the output, it defaults under `out/`.

Key flags:

- `--codec` — `h264` (default, MP4), `h265`, `vp8`/`vp9` (WebM), `gif`, `prores`,
  `mp3`/`aac`/`wav` (audio only). The output extension should match the codec.
- `--crf <n>` — constant rate factor (quality vs size). For h264 roughly 18 (high
  quality) to 28 (smaller); lower is better quality and larger files.
- `--pixel-format` — e.g. `yuv420p` for maximum compatibility (default for h264),
  or `yuva420p` for WebM with alpha/transparency.
- `--concurrency <n>` — number of parallel Chrome tabs/threads. Defaults to a value
  based on CPU cores; raise to render faster, lower to reduce memory pressure.
- `--scale <n>` — multiply output resolution (e.g. `--scale=2` for 2x supersampled
  output without changing the composition's declared dimensions).
- `--frames <a-b>` — render a frame range only, useful for previews.
- `--props` — override input props (see props-and-schema.md).
- `--timeout <ms>` — raise the per-frame delayRender timeout for slow asset loads.
- `--log=verbose` — diagnose stalls, font/asset issues, or Chrome problems.
- `--every-nth-frame` — for GIFs, render every nth frame to cut size.

Examples:

```
# high-quality MP4
npx remotion render MyVideo out/hq.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p

# transparent WebM
npx remotion render MyVideo out/clip.webm --codec=vp9 --pixel-format=yuva420p

# faster render, capped memory
npx remotion render MyVideo out/draft.mp4 --concurrency=4 --crf=26
```

## Stills and poster frames

Render a single frame to an image with `remotion still`:

```
npx remotion still MyVideo out/poster.png --frame=30
npx remotion still MyVideo out/thumb.jpg --frame=0 --image-format=jpeg --quality=90
```

- `--frame` — which frame to capture (default 0).
- `--image-format` — `png` (lossless, supports alpha) or `jpeg`.
- `--quality` — JPEG quality 1..100.
- `--scale` — supersample the still, same as for video.

Use stills for poster/thumbnail images that must match the video exactly.

## Studio

```
npx remotion studio
```

The Studio is the interactive editor: scrub the timeline, edit schema-typed props
live, pick a composition, and click Render to open the render dialog (which maps to
the CLI flags above). It is for development; production renders should go through the
CLI or cloud so they are scriptable and reproducible.

## Scaling and quality strategy

- Author at the final dimensions in the composition; use `--scale` only when you
  want supersampling beyond the declared size.
- Pick `crf` per delivery target; archive masters at low crf, social cuts higher.
- Keep `pixel-format=yuv420p` for broad playback compatibility unless you need
  alpha.
- Tune `concurrency` to the machine: more for speed, less if you hit memory limits
  or Chrome crashes.

## Programmatic rendering (Node)

For pipelines, render from Node with `@remotion/renderer` (`bundle`,
`selectComposition`, `renderMedia`) instead of shelling out, so you can compute
props, fan out variants, and capture progress in code.

## Cloud rendering: @remotion/lambda

For scale or serverless rendering, `@remotion/lambda` renders on AWS Lambda: it
splits the video into chunks, renders them in parallel functions, and stitches the
result in S3. Typical flow:

1. `npx remotion lambda functions deploy` — deploy the render function.
2. `npx remotion lambda sites create` — upload your bundled compositions to S3.
3. `npx remotion lambda render <serve-url> <comp-id>` — render, or call the
   `renderMediaOnLambda` API from your backend.

It massively cuts wall-clock time for long videos and removes the need for a big
render box, at the cost of AWS setup. `@remotion/cloudrun` is the Google Cloud
equivalent. The same composition code renders identically locally and in the cloud.

Note: cloud rendering at any meaningful scale is a company/automation use case;
check the licence (see licensing-and-security.md) before deploying it commercially.
