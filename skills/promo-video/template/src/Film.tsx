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

  return (
    <ConfigProvider value={config}>
      {config.scenes.map((scene, i) => (
        <Sequence key={i} from={spans[i].from} durationInFrames={spans[i].dur}>
          <Stage glow={scene.glow}>
            <SceneView scene={scene} />
            {captionsOn && scene.caption ? <Caption text={scene.caption} /> : null}
            {safeAreaDebug ? <SafeAreaOverlay /> : null}
          </Stage>
        </Sequence>
      ))}
    </ConfigProvider>
  );
};
