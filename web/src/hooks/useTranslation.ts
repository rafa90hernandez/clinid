// web/src/hooks/useTranslation.ts
import { locales } from '@/locales';

export function useTranslation() {
  return {
    t: locales.en,
    locale: 'en',
  };
}