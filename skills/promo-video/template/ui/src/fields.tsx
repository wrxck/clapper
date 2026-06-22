// small controlled form primitives shared by the config form. each takes a value
// and an onChange, so the whole editor stays a flat function of one config state.

import React from 'react';

export const Text: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div className="field">
    <label>{label}</label>
    <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </div>
);

export const Area: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}> = ({ label, value, onChange, hint }) => (
  <div className="field">
    <label>
      {label}
      {hint ? <span className="tag"> - {hint}</span> : null}
    </label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

export const Num: React.FC<{
  label: string;
  value: number;
  step?: number;
  min?: number;
  onChange: (v: number) => void;
}> = ({ label, value, step = 1, min, onChange }) => (
  <div className="field">
    <label>{label}</label>
    <input
      type="number"
      value={value}
      step={step}
      min={min}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
);

export const Colour: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => {
  // a colour can be an rgba() token; the native picker only handles hex, so it
  // shows a best-effort hex while the text input keeps the exact value.
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : '#000000';
  return (
    <div className="colour">
      <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} aria-label={`${label} colour`} />
      <div className="colour-meta">
        <label>{label}</label>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
};

export const Select: React.FC<{
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="field">
    <label>{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);
