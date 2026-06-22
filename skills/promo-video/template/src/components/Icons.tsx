// a small inline-svg icon set keyed by name. stroke-rounded line icons drawn
// from path data - no icon font, no emoji. add a name to the schema's iconName
// enum and a matching entry here to extend the set.

import React from 'react';

import type { IconName } from '../schema';

// each entry is the inner svg (paths drawn in a 24x24 viewbox) for currentColor
// stroke rendering.
const PATHS: Record<IconName, React.ReactNode> = {
  check: <path d="M4 12.5 9 17.5 20 6.5" />,
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  cloud: <path d="M7 18.5a4 4 0 0 1-.5-7.97 5.5 5.5 0 0 1 10.7-1.2A3.75 3.75 0 0 1 17.5 18.5H7Z" />,
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="m7 15 3.5-4 3 2.5L20 6" />
    </>
  ),
  shield: <path d="M12 2.5 5 5.5v6c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9v-6l-7-3Z" />,
  'eye-off': (
    <>
      <path d="M3 3 21 21" />
      <path d="M10.6 6.2A9.6 9.6 0 0 1 12 6c5 0 9 4.5 9 6a11 11 0 0 1-2.2 3" />
      <path d="M6.5 7.8A12.3 12.3 0 0 0 3 12c0 1.5 4 6 9 6 1 0 2-.2 2.9-.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3v6m0 6v6m-9-9h6m6 0h6" />
      <path d="m6.5 6.5 3 3m5 5 3 3m0-11-3 3m-5 5-3 3" />
    </>
  ),
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.9 6.6 20l1-6.1L3.2 9.5l6.1-.9L12 3Z" />,
  heart: <path d="M12 20.5C5 16.5 3 12.7 3 9.2A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 9 2.2c0 3.5-2 7.3-9 11.3Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.8 3 2.8 15 0 18-2.8-3-2.8-15 0-18Z" />
    </>
  ),
  device: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="3" />
      <path d="M11 18.5h2" />
    </>
  ),
};

export const Icon: React.FC<{
  name: IconName;
  size: number;
  colour?: string;
  strokeWidth?: number;
}> = ({ name, size, colour = 'currentColor', strokeWidth = 1.9 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colour}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', flex: 'none' }}
  >
    {PATHS[name]}
  </svg>
);
