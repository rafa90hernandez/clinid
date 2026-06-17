// web/src/locales/index.ts
import { en } from './en';
import { pt } from './pt';

export const locales = {
  en,
  pt,
};

export type Locale = keyof typeof locales;
export type Translation = typeof en;