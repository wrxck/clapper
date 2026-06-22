# Input props and Zod schema

Compositions take input props so the same component renders many variants. Adding a
Zod schema turns the Studio's props panel into a typed, validated form, and lets you
pass props at render time.

## defaultProps and component typing

Type the component, then give the composition `defaultProps`. Studio shows these and
they are used when no props are passed at render.

```tsx
type MyVideoProps = {
  title: string;
  accent: string;
};

export const MyVideo: React.FC<MyVideoProps> = ({ title, accent }) => {
  /* ... */
  return null;
};

<Composition
  id="MyVideo"
  component={MyVideo}
  durationInFrames={150}
  fps={30}
  width={1920}
  height={1080}
  defaultProps={{ title: "Hello", accent: "#3bd6c6" }}
/>;
```

`defaultProps` is type-checked against the component's props, so a mismatch is a
build error.

## A Zod schema for the Studio props panel

Install `zod` and `@remotion/zod-types`, define a schema, and pass it as `schema`.
The Studio then renders a typed, editable panel (colour pickers, number steppers,
enum dropdowns) and validates input.

```tsx
import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const myVideoSchema = z.object({
  title: z.string(),
  accent: zColor(),                 // colour picker in Studio
  duration: z.number().min(1),      // number input
  layout: z.enum(["left", "center"]).default("center"), // dropdown
});

export const MyVideo: React.FC<z.infer<typeof myVideoSchema>> = ({ title, accent }) => {
  /* ... */
  return null;
};
```

Register it on the composition. Derive `defaultProps` from the same schema's shape
so they cannot drift:

```tsx
<Composition
  id="MyVideo"
  component={MyVideo}
  schema={myVideoSchema}
  defaultProps={{ title: "Hello", accent: "#3bd6c6", duration: 5, layout: "center" }}
  durationInFrames={150}
  fps={30}
  width={1920}
  height={1080}
/>
```

Use `z.infer<typeof myVideoSchema>` as the component's prop type so the schema is the
single source of truth for both runtime validation and TypeScript types.

`zColor()` from `@remotion/zod-types` is the key helper; it gives a colour-picker in
Studio and a validated colour string at runtime. There are matching helpers for
other Remotion-specific types.

## calculateMetadata: props that drive the timeline

Compute duration, dimensions, or derived props from the input before rendering. For
example, set the video length from an audio file:

```tsx
import { getAudioDurationInSeconds } from "@remotion/media-utils";

<Composition
  id="MyVideo"
  component={MyVideo}
  schema={myVideoSchema}
  defaultProps={{ src: staticFile("vo.mp3"), title: "Hi", accent: "#3bd6c6", duration: 5, layout: "center" }}
  fps={30}
  width={1920}
  height={1080}
  durationInFrames={150}
  calculateMetadata={async ({ props }) => {
    const seconds = await getAudioDurationInSeconds(props.src);
    return { durationInFrames: Math.ceil(seconds * 30) };
  }}
/>
```

`calculateMetadata` can also fetch data and return augmented `props`, so the
component receives ready-to-render values.

## Passing props at render

Override props on the CLI with `--props`, either inline JSON or a file path:

```
npx remotion render MyVideo out/a.mp4 --props='{"title":"Variant A","accent":"#ff5577"}'
npx remotion render MyVideo out/b.mp4 --props=./props/b.json
```

Props from `--props` are validated against the schema, then merged over
`defaultProps`. This is how you batch-render many variants from one composition.

## Embedding in a web app: @remotion/player

`@remotion/player` renders the same composition live in a React app (no server
render) for previews, configurators, or in-product video. It takes the component,
the timeline config, and `inputProps`.

```tsx
import { Player } from "@remotion/player";
import { MyVideo } from "./MyVideo";

<Player
  component={MyVideo}
  inputProps={{ title: "Live", accent: "#3bd6c6", duration: 5, layout: "center" }}
  durationInFrames={150}
  fps={30}
  compositionWidth={1920}
  compositionHeight={1080}
  style={{ width: "100%" }}
  controls
  loop
/>;
```

The Player plays in the browser in real time; it does not produce a file. To get an
MP4 you still render via the CLI or Lambda (see rendering.md). Keep the component
identical between Player and render so the preview matches the output exactly.
