'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language, Region } from '@/types';
import { Trans, TRANSLATIONS, PRICES } from './translations';

interface I18nContextType {
  lang: Language;
  setLang: (l: Language) => void;
  region: Region;
  setRegion: (r: Region) => void;
  t: Trans;
  prices: { pro: string; elite: string; currency: string };
}

const I18nContext = createContext<I18nContextType>({} as I18nContextType);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('EN');
  const [region, setRegion] = useState<Region>('MY');

  const t = TRANSLATIONS[lang];
  const prices = PRICES[region];

  return (
    <I18nContext.Provider value={{ lang, setLang, region, setRegion, t, prices }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
