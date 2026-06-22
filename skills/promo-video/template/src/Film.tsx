// the film: the whole config arrives as remotion inputProps (typed by the zod
// schema), is validated, then provided through context. each scene is mounted on
// a computed timeline inside its own stage (backdrop + exit transition). every
// composition (one per format) renders this exact component - scenes adapt via
// useframe, so the same source serves every aspect ratio.

import React from 'react';
import { Sequence } from 'remotion';

import { Stage } from './components/Stage';
import { ConfigProvider } from './lib/context';
import { sceneFrames } from './lib/timeline';
import { SceneView } from './scenes/Scenes';
import { configSchema, type Config } from './schema';

export const Film: React.FC<Config> = (props) => {
  // validate + apply defaults at the boundary so the rest of the tree is typed.
  const config: Config = configSchema.parse(props);
  const fps = config.fps;
  const spans = sceneFrames(config.scenes, fps);

  return (
    <ConfigProvider value={config}>
      {config.scenes.map((scene, i) => (
        <Sequence key={i} from={spans[i].from} durationInFrames={spans[i].dur}>
          <Stage glow={scene.glow}>
            <SceneView scene={scene} />
          </Stage>
        </Sequence>
      ))}
    </ConfigProvider>
  );
};
