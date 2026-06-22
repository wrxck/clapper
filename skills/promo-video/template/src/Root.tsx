// register one composition per format in the config, all rendering the film with
// the validated config as defaultprops and the zod schema as the typed props
// schema (so remotion studio and the render cli both edit/validate the same
// shape). durationinframes is the sum of the scene durations.

import React from 'react';
import { Composition } from 'remotion';

import { Film } from './Film';
import { config } from './config';
import { totalFrames } from './lib/timeline';
import { configSchema } from './schema';

export const Root: React.FC = () => {
  const dur = totalFrames(config.scenes, config.fps);
  return (
    <>
      {config.formats.map((f) => (
        <Composition
          key={f.id}
          id={f.id}
          component={Film}
          schema={configSchema}
          defaultProps={config}
          durationInFrames={dur}
          fps={config.fps}
          width={f.width}
          height={f.height}
        />
      ))}
    </>
  );
};
