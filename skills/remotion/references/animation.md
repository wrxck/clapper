# Animation

Animation in Remotion is driven by the frame number, not by time or CSS. On every
frame the renderer mounts the component, reads the frame, and paints one still. The
output is the sequence of those stills. This is why animation must be a pure
function of the frame.

## The frame is the clock, not CSS

Do NOT use CSS transitions, CSS keyframe animations, `setTimeout`, `setInterval`,
`requestAnimationFrame`, or `Date.now()` to move things. The renderer captures a
frame instantly; wall-clock-based motion will not advance and will render as a
frozen or wrong frame. Every animated value must be computed from
`useCurrentFrame()`.

Wrong:

```tsx
// transitions never advance during render - the frame is captured instantly
<div style={{ transition: "opacity 1s", opacity: visible ? 1 : 0 }} />
```

Right:

```tsx
const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
<div style={{ opacity }} />;
```

## useCurrentFrame and useVideoConfig

```tsx
import { useCurrentFrame, useVideoConfig } from "remotion";

const frame = useCurrentFrame();                 // 0-based, relative to any Sequence
const { fps, durationInFrames, width, height } = useVideoConfig();
const seconds = frame / fps;                     // convert when you need real time
```

Inside a `<Sequence from={N}>`, `useCurrentFrame()` returns 0 at frame N, so child
components can be authored as if they start at zero.

## interpolate

`interpolate` maps a value from one range to another. The default extrapolation is
`"extend"`, which keeps going past the input range; almost always clamp instead, or
values overshoot.

```tsx
import { interpolate } from "remotion";

const x = interpolate(frame, [0, 60], [0, 500], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

- Input and output arrays must be the same length; inputs must strictly increase.
- Multi-stop ranges work: `interpolate(frame, [0, 30, 60], [0, 1, 0])` fades in
  then out.
- Add `easing` for non-linear motion (see Easing below).

## spring

`spring` produces natural, physics-based motion. It needs `fps` and the current
`frame`, and returns a value that settles toward 1 (by default from 0).

```tsx
import { spring } from "remotion";

const scale = spring({
  frame,
  fps,
  config: { damping: 200, mass: 1, stiffness: 100 },
  // durationInFrames, delay are also available
});
<div style={{ transform: `scale(${scale})` }} />;
```

- Higher `damping` settles faster with less bounce; lower adds overshoot.
- Use `spring({ frame: frame - delay, fps })` to stagger, or the `delay` option.
- `config.overshootClamping: true` removes any overshoot past the target.
- Map a spring through `interpolate` to retarget its 0..1 output to any range:
  `interpolate(spring({frame, fps}), [0, 1], [40, 0])` for a slide-up of 40px.

## Easing

`Easing` supplies curves for `interpolate`'s `easing` option.

```tsx
import { interpolate, Easing } from "remotion";

const o = interpolate(frame, [0, 30], [0, 1], {
  easing: Easing.out(Easing.cubic),
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

Common choices: `Easing.linear`, `Easing.ease`, `Easing.inOut(Easing.cubic)`,
`Easing.out(Easing.quad)`, `Easing.bezier(0.16, 1, 0.3, 1)`.

## Staggering

Stagger by offsetting the frame per item with a per-item delay:

```tsx
const STAGGER = 5; // frames between items
items.map((item, i) => {
  const local = frame - i * STAGGER;
  const enter = spring({ frame: local, fps, config: { damping: 200 } });
  return <Item key={item.id} style={{ opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` }} />;
});
```

For scene-level staggering, prefer `<Series>` with `offset`, or nested
`<Sequence from={...}>` (see compositions.md).

## Deterministic randomness: random(), never Math.random()

`Math.random()` returns a different value on every call, so a value would differ
between the Studio preview and the render, and even between frames, producing
flicker. Use Remotion's `random(seed)`, which is deterministic for a given seed.

```tsx
import { random } from "remotion";

// stable per index, identical every frame and every render
const jitter = random(`particle-${i}`) * 10 - 5;

// if you genuinely want per-frame variation, fold the frame into the seed
const noise = random(`spark-${i}-${frame}`);
```

Pass a string or number seed. The same seed always yields the same number, which is
what keeps renders reproducible.

## Putting it together

```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";

export const Title: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 200 } });
  const y = interpolate(enter, [0, 1], [40, 0]);
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <h1 style={{ color: "white", opacity, transform: `translateY(${y}px)` }}>{text}</h1>
    </AbsoluteFill>
  );
};
```
