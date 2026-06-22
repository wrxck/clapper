// the per-scene editor: edits one scene's typed fields, and the list controls to
// reorder / add / remove beats. the editable fields shown depend on scene.type;
// the icon and frame option lists come straight from the schema enums so the ui
// can never offer a value the film cannot render.

import React from 'react';

import { iconNameSchema, deviceSceneSchema, type Scene, type SceneType } from '../../src/schema';
import { Area, Colour, Num, Select, Text } from './fields';

const ICONS = iconNameSchema.options as readonly string[];
const FRAMES = deviceSceneSchema.shape.frame.unwrap().options as readonly string[];

const SCENE_TYPES: readonly SceneType[] = [
  'title',
  'bullets',
  'features',
  'device',
  'stat',
  'pricing',
  'cta',
];

// a sensible blank scene for each type, used by "add scene".
export const blankScene = (type: SceneType): Scene => {
  switch (type) {
    case 'title':
      return { type, durSec: 3, words: ['New', 'title'], sub: '' };
    case 'bullets':
      return { type, durSec: 4, heading: 'Heading', items: [{ icon: 'shield', line: 'A point.' }] };
    case 'features':
      return {
        type,
        durSec: 5,
        heading: 'Features',
        cards: [{ icon: 'sparkles', title: 'Title', desc: 'Description.' }],
      };
    case 'device':
      return { type, durSec: 5, frame: 'phone', headline: 'Headline', sub: '' };
    case 'stat':
      return { type, durSec: 3, value: 100, suffix: '', label: 'Label' };
    case 'pricing':
      return { type, durSec: 3, price: 'Free', period: '', sub: '' };
    case 'cta':
      return { type, durSec: 3, url: 'example.com', line: '', showLogo: true };
  }
};

export const SceneEditor: React.FC<{
  scene: Scene;
  index: number;
  total: number;
  onChange: (s: Scene) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}> = ({ scene, index, total, onChange, onMove, onRemove }) => {
  // typed patch helper - merges fields into the current scene without losing its
  // discriminant.
  const set = (patch: Partial<Scene>) => onChange({ ...scene, ...patch } as Scene);

  return (
    <div className="scene">
      <div className="scene-head">
        <span className="type">
          {index + 1}. {scene.type}
        </span>
        <button type="button" className="icon" title="move up" disabled={index === 0} onClick={() => onMove(-1)}>
          up
        </button>
        <button type="button" className="icon" title="move down" disabled={index === total - 1} onClick={() => onMove(1)}>
          down
        </button>
        <button type="button" className="icon" title="remove" onClick={onRemove}>
          x
        </button>
      </div>
      <div className="scene-body">
        <Num label="duration (s)" value={scene.durSec} step={0.1} min={0.5} onChange={(v) => set({ durSec: v })} />
        <Colour label="glow" value={scene.glow ?? ''} onChange={(v) => set({ glow: v })} />
        <Text
          label="caption (sound-off)"
          value={scene.caption ?? ''}
          onChange={(v) => set({ caption: v })}
          placeholder="pinned lower-third line"
        />

        {scene.type === 'title' ? (
          <>
            <Area
              label="words"
              hint="one line; split on spaces for kinetic stagger"
              value={scene.words.join(' ')}
              onChange={(v) => set({ words: v.split(/\s+/).filter(Boolean) })}
            />
            <Text label="sub" value={scene.sub ?? ''} onChange={(v) => set({ sub: v })} />
            <Select
              label="show logo"
              value={scene.showLogo ? 'yes' : 'no'}
              options={['no', 'yes']}
              onChange={(v) => set({ showLogo: v === 'yes' })}
            />
          </>
        ) : null}

        {scene.type === 'bullets' ? (
          <>
            <Text label="heading" value={scene.heading ?? ''} onChange={(v) => set({ heading: v })} />
            {scene.items.map((it, i) => (
              <div key={i} className="item-row">
                <Select
                  label="icon"
                  value={it.icon}
                  options={ICONS}
                  onChange={(v) =>
                    set({ items: scene.items.map((x, j) => (j === i ? { ...x, icon: v as typeof x.icon } : x)) })
                  }
                />
                <Text
                  label="line"
                  value={it.line}
                  onChange={(v) => set({ items: scene.items.map((x, j) => (j === i ? { ...x, line: v } : x)) })}
                />
                <button type="button" className="icon" onClick={() => set({ items: scene.items.filter((_, j) => j !== i) })}>
                  remove item
                </button>
              </div>
            ))}
            <button type="button" onClick={() => set({ items: [...scene.items, { icon: 'shield', line: 'A point.' }] })}>
              add item
            </button>
          </>
        ) : null}

        {scene.type === 'features' ? (
          <>
            <Text label="heading" value={scene.heading ?? ''} onChange={(v) => set({ heading: v })} />
            {scene.cards.map((c, i) => (
              <div key={i} className="item-row">
                <Select
                  label="icon"
                  value={c.icon}
                  options={ICONS}
                  onChange={(v) =>
                    set({ cards: scene.cards.map((x, j) => (j === i ? { ...x, icon: v as typeof x.icon } : x)) })
                  }
                />
                <Text
                  label="title"
                  value={c.title}
                  onChange={(v) => set({ cards: scene.cards.map((x, j) => (j === i ? { ...x, title: v } : x)) })}
                />
                <Text
                  label="desc"
                  value={c.desc}
                  onChange={(v) => set({ cards: scene.cards.map((x, j) => (j === i ? { ...x, desc: v } : x)) })}
                />
                <button type="button" className="icon" onClick={() => set({ cards: scene.cards.filter((_, j) => j !== i) })}>
                  remove card
                </button>
              </div>
            ))}
            <button type="button" onClick={() => set({ cards: [...scene.cards, { icon: 'sparkles', title: 'Title', desc: 'Desc.' }] })}>
              add card
            </button>
          </>
        ) : null}

        {scene.type === 'device' ? (
          <>
            <Select label="frame" value={scene.frame} options={FRAMES} onChange={(v) => set({ frame: v as typeof scene.frame })} />
            <Text label="image (public/ path)" value={scene.image ?? ''} onChange={(v) => set({ image: v })} placeholder="screenshot.png" />
            <Text label="headline" value={scene.headline ?? ''} onChange={(v) => set({ headline: v })} />
            <Text label="sub" value={scene.sub ?? ''} onChange={(v) => set({ sub: v })} />
          </>
        ) : null}

        {scene.type === 'stat' ? (
          <>
            <Num label="value" value={scene.value} step={0.1} onChange={(v) => set({ value: v })} />
            <Text label="prefix" value={scene.prefix ?? ''} onChange={(v) => set({ prefix: v })} />
            <Text label="suffix" value={scene.suffix ?? ''} onChange={(v) => set({ suffix: v })} />
            <Num label="decimals" value={scene.decimals ?? 0} min={0} onChange={(v) => set({ decimals: v })} />
            <Text label="label" value={scene.label} onChange={(v) => set({ label: v })} />
          </>
        ) : null}

        {scene.type === 'pricing' ? (
          <>
            <Text label="price" value={scene.price} onChange={(v) => set({ price: v })} />
            <Text label="period" value={scene.period ?? ''} onChange={(v) => set({ period: v })} />
            <Text label="sub" value={scene.sub ?? ''} onChange={(v) => set({ sub: v })} />
          </>
        ) : null}

        {scene.type === 'cta' ? (
          <>
            <Text label="url" value={scene.url} onChange={(v) => set({ url: v })} />
            <Text label="line" value={scene.line ?? ''} onChange={(v) => set({ line: v })} />
            <Select
              label="show logo"
              value={(scene.showLogo ?? true) ? 'yes' : 'no'}
              options={['no', 'yes']}
              onChange={(v) => set({ showLogo: v === 'yes' })}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};

export const AddScene: React.FC<{ onAdd: (s: Scene) => void }> = ({ onAdd }) => {
  const [type, setType] = React.useState<SceneType>('title');
  return (
    <div className="row">
      <select value={type} onChange={(e) => setType(e.target.value as SceneType)}>
        {SCENE_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <button type="button" className="primary" onClick={() => onAdd(blankScene(type))}>
        add scene
      </button>
    </div>
  );
};
