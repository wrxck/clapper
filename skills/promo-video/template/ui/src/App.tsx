// the tuning ui: one config in state, a form on the left bound to it, a live
// <player> preview on the right bound to the same state. the player renders the
// real film with the config as inputprops, so what you tune is what you render.
// export downloads the edited clapper.config.json; copy puts it on the clipboard.

import React from 'react';
import { Player } from '@remotion/player';

import { Film } from '../../src/Film';
import { totalFrames } from '../../src/lib/timeline';
import { configSchema, type Brand, type Config, type Scene } from '../../src/schema';
import initialRaw from '../../clapper.config.json';
import { Colour, Num, Text } from './fields';
import { AddScene, SceneEditor } from './SceneEditor';
import './ui.css';

const initial: Config = configSchema.parse(initialRaw);

// the brand colour tokens, in display order.
const COLOUR_KEYS: Array<[keyof Brand, string]> = [
  ['bg', 'background'],
  ['surface', 'surface'],
  ['surfaceEdge', 'surface edge'],
  ['ink', 'ink'],
  ['inkMuted', 'ink muted'],
  ['inkFaint', 'ink faint'],
  ['accent', 'accent'],
  ['accent2', 'accent 2'],
  ['accent3', 'accent 3'],
  ['good', 'good'],
];

export const App: React.FC = () => {
  const [config, setConfig] = React.useState<Config>(initial);
  const [formatId, setFormatId] = React.useState<string>(initial.formats[0]?.id ?? '');

  const format = config.formats.find((f) => f.id === formatId) ?? config.formats[0];
  const dur = Math.max(1, totalFrames(config.scenes, config.fps));

  const setBrand = (patch: Partial<Brand>) => setConfig((c) => ({ ...c, brand: { ...c.brand, ...patch } }));

  const setScene = (i: number, s: Scene) =>
    setConfig((c) => ({ ...c, scenes: c.scenes.map((x, j) => (j === i ? s : x)) }));

  const moveScene = (i: number, dir: -1 | 1) =>
    setConfig((c) => {
      const j = i + dir;
      if (j < 0 || j >= c.scenes.length) return c;
      const scenes = c.scenes.slice();
      [scenes[i], scenes[j]] = [scenes[j], scenes[i]];
      return { ...c, scenes };
    });

  const removeScene = (i: number) =>
    setConfig((c) => ({ ...c, scenes: c.scenes.filter((_, j) => j !== i) }));

  const addScene = (s: Scene) => setConfig((c) => ({ ...c, scenes: [...c.scenes, s] }));

  const json = React.useMemo(() => JSON.stringify(config, null, 2), [config]);

  const download = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'clapper.config.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copy = () => {
    void navigator.clipboard?.writeText(json);
  };

  return (
    <div className="shell">
      <div className="panel">
        <div className="panel-inner">
          <div className="brandbar">
            <h1>Clapper</h1>
            <span className="muted">promo tuner</span>
          </div>

          <details className="group" open>
            <summary>Brand</summary>
            <div className="group-body">
              <Text label="name" value={config.brand.name} onChange={(v) => setBrand({ name: v })} />
              <Text label="tagline" value={config.brand.tagline} onChange={(v) => setBrand({ tagline: v })} />
              <Text label="display font" value={config.brand.fontDisplay} onChange={(v) => setBrand({ fontDisplay: v })} />
              <Text label="text font" value={config.brand.fontText} onChange={(v) => setBrand({ fontText: v })} />
              <div className="colour-row">
                {COLOUR_KEYS.map(([key, label]) => (
                  <Colour
                    key={key}
                    label={label}
                    value={String(config.brand[key] ?? '')}
                    onChange={(v) => setBrand({ [key]: v } as Partial<Brand>)}
                  />
                ))}
              </div>
            </div>
          </details>

          <details className="group" open>
            <summary>Timeline</summary>
            <div className="group-body">
              <Num
                label="fps"
                value={config.fps}
                onChange={(v) => setConfig((c) => ({ ...c, fps: Math.max(1, Math.round(v)) }))}
              />
              {config.scenes.map((s, i) => (
                <SceneEditor
                  key={i}
                  scene={s}
                  index={i}
                  total={config.scenes.length}
                  onChange={(ns) => setScene(i, ns)}
                  onMove={(d) => moveScene(i, d)}
                  onRemove={() => removeScene(i)}
                />
              ))}
              <AddScene onAdd={addScene} />
            </div>
          </details>

          <div className="row">
            <button type="button" className="primary" onClick={download}>
              export clapper.config.json
            </button>
            <button type="button" onClick={copy}>
              copy json
            </button>
          </div>
        </div>
      </div>

      <div className="preview">
        <div className="preview-bar">
          <select value={format?.id} onChange={(e) => setFormatId(e.target.value)}>
            {config.formats.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label} ({f.width}x{f.height})
              </option>
            ))}
          </select>
          <span className="spacer" />
          <span className="tag">
            {config.scenes.length} scenes - {(dur / config.fps).toFixed(1)}s
          </span>
        </div>
        <div className="preview-stage">
          {format ? (
            <div
              className="player-box"
              style={{ width: `min(100%, calc(72vh * ${format.width / format.height}))` }}
            >
              <Player
                component={Film}
                inputProps={config}
                durationInFrames={dur}
                fps={config.fps}
                compositionWidth={format.width}
                compositionHeight={format.height}
                style={{ width: '100%', height: 'auto' }}
                controls
                loop
                autoPlay
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
