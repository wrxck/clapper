---
name: remotion
description: >-
  Build and render videos programmatically with Remotion, the React video
  framework. Load this skill when scaffolding a Remotion project, writing
  compositions, animating with the frame clock (useCurrentFrame, interpolate,
  spring), wiring typed input props with a Zod schema, loading fonts and assets,
  running Remotion Studio, or rendering to MP4/WebM/stills via the CLI or
  @remotion/lambda. It also covers two things that are easy to get wrong:
  pinning the latest secure version, and Remotion's company-licence requirement
  (free for individuals and small teams, paid above a defined team size). Use it
  standalone or as the engine behind the sibling promo-video skill.
---

# Remotion

Remotion renders real video (MP4, WebM, GIF, stills) from React components. Every
frame is a deterministic function of a frame number, so the same input always
produces the same output. You build with normal React + CSS, preview in a Studio,
and render headlessly in Chrome.

This skill teaches the professional path: scaffold, animate from the frame clock,
type the props, render reproducibly, stay on a current secure version, and respect
the licence. Read the reference file for whatever you are doing rather than loading
everything up front.

## Licensing: read this before shipping

Remotion is open source but NOT unconditionally free for companies. It carries a
custom licence, not MIT/Apache.

- Free: individuals; non-profit organisations; for-profit organisations with up to
  3 employees; non-commercial evaluation.
- Paid Company Licence required: for-profit organisations with 4 or more people.
  Team size is aggregated across all involved parties, so an agency plus its
  client, plus part-time staff and independent contractors, are counted together.
- Current pricing is per seat per month (Remotion advertises USD 25/seat/month for
  the creator tier; automation tiers carry a minimum spend). Confirm live numbers
  before quoting them to anyone.

Practical rule: if you are building this for a company of 4+ people, or for a
client whose combined headcount reaches 4+, a Company Licence is required before
the work is used commercially. Authoritative source:
https://www.remotion.dev/docs/license and the LICENSE.md in the repo. Pricing:
https://www.remotion.pro/license. Full detail in
references/licensing-and-security.md.

## Prerequisites

- Node.js 20 or newer (`node -v`).
- A package manager: npm, pnpm, yarn or bun.
- Chrome/Chromium for rendering: Remotion downloads its own Chrome Headless Shell
  on first render, so a system browser is not required. On Linux CI install the
  shared libraries it needs (`fonts`, `libnss3`, `libatk`, etc.) or use the
  official Docker image.
- ffmpeg is bundled by Remotion; a separate system ffmpeg is optional.

## Scaffold and run

Always scaffold with the latest version rather than copying a pinned template:

```
npx create-video@latest
```

Pick a template (Blank or Hello World are good starting points). This generates a
project with `remotion`, `@remotion/cli`, React, and a `src/` containing
`Root.tsx` (composition registry) and at least one composition component.

Inside the project:

```
npx remotion studio          # interactive editor + timeline + props panel
npx remotion render           # render the default composition to out/
npx remotion render <id> out/video.mp4
npx remotion still <id> out/poster.png --frame=30
npx remotion versions         # check every @remotion/* package agrees
npx remotion upgrade          # bump all Remotion packages together
```

Studio (formerly Preview) is where you scrub, inspect props, and trigger renders.

## Check and pin the latest version

Remotion ships very frequently (often several patch releases per week) and every
`@remotion/*` package MUST be on the exact same version, or rendering breaks.

```
npm view remotion version          # latest published version
npm view remotion time --json      # release dates, to judge recency
npx remotion versions              # verify your installed packages all match
```

Pin exact versions (no `^`) in package.json and bump deliberately with
`npx remotion upgrade`, which moves every Remotion package in lockstep. After
upgrading, run a render to confirm output is unchanged. See
references/licensing-and-security.md for the safe-upgrade and audit routine.

## Core model in one paragraph

A composition declares `id`, `component`, `durationInFrames`, `fps`, `width`,
`height` and `defaultProps`. The component reads the current frame with
`useCurrentFrame()` and the timeline metadata with `useVideoConfig()`, then maps
the frame to visual state with `interpolate` and `spring`. Layout uses
`AbsoluteFill`; time slicing uses `Sequence` and `Series`. Nothing animates via
CSS transitions or `setTimeout`; the frame number drives everything so the render
is deterministic and seekable. Randomness must come from Remotion's `random()`,
never `Math.random()`.

## References

Load the one you need:

- references/compositions.md — registerRoot, `<Composition>`, multiple aspect
  ratios, durationInFrames/fps, AbsoluteFill, Sequence and Series.
- references/animation.md — useCurrentFrame, useVideoConfig, interpolate, spring,
  Easing, staggering, deterministic random(); why CSS transitions are wrong.
- references/fonts-and-assets.md — delayRender/continueRender, @remotion/google-fonts,
  staticFile and the public/ folder.
- references/props-and-schema.md — input props, a Zod schema for the typed Studio
  props panel, defaultProps, `--props` at render, embedding with @remotion/player.
- references/rendering.md — `remotion render` (codecs, crf, concurrency, scale),
  stills/poster frames, Studio, and @remotion/lambda for cloud rendering.
- references/licensing-and-security.md — who must pay, version pinning, npm audit,
  and safe-upgrade guidance.

## Conventions for good output

- Keep durations explicit and in frames; derive seconds from `fps`.
- Make every component a pure function of its props and the frame.
- Drive all motion from `interpolate`/`spring`; clamp extrapolation at edges.
- Type props with Zod so the Studio gives an editable, validated panel.
- Keep one version across all `@remotion/*` packages; upgrade in lockstep.
- Decide the licence question early; do not ship commercial work for a 4+ team
  without a Company Licence.
