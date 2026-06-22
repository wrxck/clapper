# Compositions

A composition is one renderable video: a component plus its timeline metadata. You
declare compositions inside a root component and register that root once.

## registerRoot

`src/index.ts` is the entry point. It registers exactly one root component:

```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
```

The root returns one or more `<Composition>` elements. It renders only in the
Studio and during rendering; it is not part of any output frame.

```tsx
import { Composition } from "remotion";
import { MyVideo } from "./MyVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ title: "Hello" }}
      />
    </>
  );
};
```

## The <Composition> props

- `id` — unique, used on the CLI (`remotion render MyVideo`). Keep it stable.
- `component` (or `lazyComponent`) — the React component to render per frame.
- `durationInFrames` — total length in frames. Seconds = `durationInFrames / fps`.
- `fps` — frames per second. 30 is common; 24 for film feel; 60 for ultra-smooth.
- `width` / `height` — pixel dimensions of the output.
- `defaultProps` — typed default input props shown in the Studio (see
  props-and-schema.md). Prefer these over hardcoding values inside the component.
- `schema` — a Zod schema that makes the Studio props panel typed and editable.
- `calculateMetadata` — optional async function to compute duration/dimensions/props
  from the input (for example, set `durationInFrames` from an audio file's length).

## Multiple aspect ratios

Register one `<Composition>` per aspect ratio, sharing the same component. The
component should read `useVideoConfig()` for `width`/`height` and lay out relative
to those, so a single source adapts to every format.

```tsx
const FORMATS = [
  { id: "Landscape", width: 1920, height: 1080 }, // 16:9
  { id: "Vertical",  width: 1080, height: 1920 }, // 9:16
  { id: "Square",    width: 1080, height: 1080 }, // 1:1
  { id: "Portrait",  width: 1080, height: 1350 }, // 4:5
];

export const RemotionRoot: React.FC = () => (
  <>
    {FORMATS.map((f) => (
      <Composition
        key={f.id}
        id={f.id}
        component={MyVideo}
        durationInFrames={300}
        fps={30}
        width={f.width}
        height={f.height}
        defaultProps={{ title: "Hello" }}
      />
    ))}
  </>
);
```

A common pattern is a short-edge unit so type and spacing scale with the format:

```tsx
const { width, height } = useVideoConfig();
const u = Math.min(width, height) / 100; // 1u = 1% of the short edge
// fontSize: 8 * u, padding: 4 * u, etc.
```

## AbsoluteFill

`AbsoluteFill` is a `div` that fills the whole frame with `position: absolute` and
inset 0, plus a column flexbox. Use it for full-bleed backgrounds and for stacking
layers; later children paint on top.

```tsx
import { AbsoluteFill } from "remotion";

export const MyVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0b0b0f" }}>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <h1 style={{ color: "white" }}>Hello</h1>
    </AbsoluteFill>
  </AbsoluteFill>
);
```

## Sequence: time-shifting

`<Sequence>` shifts its children in time. A child inside a Sequence sees a frame of
0 at the Sequence's `from`, so components can be written as if they start at zero.

```tsx
import { Sequence } from "remotion";

<Sequence from={0} durationInFrames={60}>
  <Intro />
</Sequence>
<Sequence from={60} durationInFrames={90}>
  <Body />
</Sequence>
```

- `from` — frame at which the child appears (can be negative to start mid-animation).
- `durationInFrames` — how long the child stays mounted (default: to the end).
- `layout="none"` — drop the default absolute-fill wrapper when you only want the
  time shift, not the layout box.

## Series: sequential scenes

`<Series>` chains segments back to back without manual frame maths. Each
`<Series.Sequence>` starts when the previous one ends.

```tsx
import { Series } from "remotion";

<Series>
  <Series.Sequence durationInFrames={40}>
    <SceneA />
  </Series.Sequence>
  <Series.Sequence durationInFrames={60} offset={-10}>
    <SceneB />   {/* offset overlaps SceneB 10 frames into SceneA */}
  </Series.Sequence>
</Series>
```

Use `offset` to overlap or gap adjacent scenes. The total duration should not
exceed the composition's `durationInFrames`.

## Audio and video inside compositions

Use `<Audio src={staticFile("music.m4a")} />` and `<OffthreadVideo src={...} />`
from `remotion`. They are also time-shifted by any enclosing `<Sequence>`. Trim
with `startFrom`/`endAt`, and set `volume` (a number, or a function of frame for
fades). Prefer `OffthreadVideo` over the DOM `<video>` for reliable rendering.
