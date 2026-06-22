// load the brand's webfonts before any frame renders. delayRender holds the
// frame until every face is ready, so there is never a flash of fallback type in
// the output. faces come from brand.fonts in the config (each { family, url });
// a url under public/ is resolved with staticFile, an absolute http(s) url is
// used as-is (e.g. a google-fonts file). idempotent across the timeline.

import { continueRender, delayRender, staticFile } from 'remotion';

import type { FontFaceDef } from '../schema';

const loaded = new Set<string>();

const resolve = (url: string): string =>
  /^(https?:)?\/\//.test(url) || url.startsWith('data:') ? url : staticFile(url);

export const loadBrandFonts = (faces: readonly FontFaceDef[] | undefined): void => {
  if (!faces || faces.length === 0 || typeof document === 'undefined') return;
  const pending = faces.filter((f) => !loaded.has(`${f.family}:${f.url}`));
  if (pending.length === 0) return;
  pending.forEach((f) => loaded.add(`${f.family}:${f.url}`));

  const handle = delayRender('brand fonts');
  void Promise.all(
    pending.map(async (f) => {
      const face = new FontFace(f.family, `url(${resolve(f.url)})`, {
        weight: f.weight ?? '100 900',
        style: f.style ?? 'normal',
      });
      await face.load();
      (document.fonts as unknown as { add(face: FontFace): void }).add(face);
    }),
  )
    .then(() => continueRender(handle))
    .catch(() => continueRender(handle));
};
