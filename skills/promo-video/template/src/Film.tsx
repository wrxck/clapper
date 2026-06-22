// the film: the whole config arrives as remotion inputProps (typed by the zod
// schema), is validated, then provided through context. each scene is mounted on
// a computed timeline inside its own stage (backdrop + exit transition). every
// composition (one per format) renders this exact component - scenes adapt via
// useframe, so the same source serves every aspect ratio.

import React from 'react';
import { Sequence } from 'remotion';

import { Caption, SafeAreaOverlay } from './components/Caption';
import { Stage } from './components/Stage';
import { ConfigProvider } from './lib/context';
import { sceneFrames } from './lib/timeline';
import { SceneView } from './scenes/Scenes';
import { configSchema, type Config } from './schema';

// dev-only safe-area overlay for qa. gated two ways, both off by default so it
// never ships in a normal render:
//   - env: REMOTION_SAFE_AREA=1 - remotion inlines REMOTION_-prefixed vars into
//     the bundle on every render path (studio, still, render).
//   - prop: config.debugSafeArea true - flows through validated props (also the
//     way the vite-built tuning ui can switch it on).
const envSafeArea = (): boolean => {
  try {
    return typeof process !== 'undefined' && Boolean(process.env?.REMOTION_SAFE_AREA);
  } catch {
    return false;
  }
};

export const Film: React.FC<Config> = (props) => {
  // validate + apply defaults at the boundary so the rest of the tree is typed.
  const config: Config = configSchema.parse(props);
  const fps = config.fps;
  const spans = sceneFrames(config.scenes, fps);
  const captionsOn = config.captions?.enabled ?? true;
  const safeAreaDebug = Boolean(config.debugSafeArea) || envSafeArea();
  // captions add value only where the on-screen text is not already the whole
  // message - the visual scenes. on text-dominant scenes the headline carries it,
  // so a caption just echoes it; suppress unless explicitly forced.
  const CAPTION_TYPES = new Set(['device', 'stat']);
  const showCaption = (scene: Config['scenes'][number]): boolean =>
    captionsOn && Boolean(scene.caption) && (CAPTION_TYPES.has(scene.type) || scene.forceCaption === true);

  return (
    <ConfigProvider value={config}>
      {config.scenes.map((scene, i) => (
        <Sequence key={i} from={spans[i].from} durationInFrames={spans[i].dur}>
          <Stage glow={scene.glow}>
            <SceneView scene={scene} />
            {showCaption(scene) ? <Caption text={scene.caption as string} /> : null}
            {safeAreaDebug ? <SafeAreaOverlay /> : null}
          </Stage>
        </Sequence>
      ))}
    </ConfigProvider>
  );
};
