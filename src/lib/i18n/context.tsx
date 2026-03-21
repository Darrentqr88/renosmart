'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Region } from '@/types';
import { Trans, TRANSLATIONS, PRICES } from './translations';
import { createClient } from '@/lib/supabase/client';

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

  // Auto-detect region from user profile on mount
  useEffect(() => {
    // 1. Check localStorage first (user manually switched → respect that)
    const saved = localStorage.getItem('rs_region') as Region | null;
    if (saved === 'MY' || saved === 'SG') {
      setRegion(saved);
      return;
    }
    // 2. Load from Supabase profile
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from('profiles')
        .select('region, phone')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.region === 'SG') {
            setRegion('SG');
          } else if (!data?.region && data?.phone?.startsWith('+65')) {
            // Fallback: detect from phone for existing accounts without region field
            setRegion('SG');
          }
          // else stay as MY (default)
        });
    });
  }, []);

  const t = TRANSLATIONS[lang];
  const prices = PRICES[region];

  // Persist manual region changes to localStorage
  const handleSetRegion = (r: Region) => {
    setRegion(r);
    localStorage.setItem('rs_region', r);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, region, setRegion: handleSetRegion, t, prices }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
