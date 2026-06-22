// brand + config flow through react context, never static imports. the film
// receives the whole config as remotion inputProps and provides it here; every
// scene and component reads brand tokens and scene data from these hooks, so the
// kit is fully data-driven and the same components serve any product.

import React, { createContext, useContext } from 'react';

import type { Brand, Config } from '../schema';

const ConfigContext = createContext<Config | null>(null);

export const ConfigProvider: React.FC<{ value: Config; children: React.ReactNode }> = ({
  value,
  children,
}) => <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;

export const useConfig = (): Config => {
  const c = useContext(ConfigContext);
  if (!c) throw new Error('useConfig must be used within a ConfigProvider');
  return c;
};

export const useBrand = (): Brand => useConfig().brand;

// css font-family stacks built from the brand's chosen display/text families.
export const useFonts = (): { display: string; text: string } => {
  const b = useBrand();
  return {
    display: `'${b.fontDisplay}', system-ui, sans-serif`,
    text: `'${b.fontText}', system-ui, sans-serif`,
  };
};
