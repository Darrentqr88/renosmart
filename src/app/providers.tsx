'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (key && typeof window !== 'undefined') {
      posthog.init(key, {
        api_host: host || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        loaded: (ph) => {
          if (process.env.NODE_ENV === 'development') ph.debug();
        },
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

/** Crisp chat widget — loads only in production or when ID is set */
export function CrispChat() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    if (!id || typeof window === 'undefined') return;
    (window as unknown as Record<string, unknown>).$crisp = [];
    (window as unknown as Record<string, unknown>).CRISP_WEBSITE_ID = id;
    const s = document.createElement('script');
    s.src = 'https://client.crisp.chat/l.js';
    s.async = true;
    document.head.appendChild(s);

    // After Crisp loads, identify logged-in user
    s.onload = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email, plan, company')
          .eq('user_id', user.id)
          .single();

        const crisp = (window as unknown as Record<string, unknown[]>).$crisp;
        if (!crisp || !profile) return;

        if (profile.email) crisp.push(['set', 'user:email', [profile.email]]);
        if (profile.name) crisp.push(['set', 'user:nickname', [profile.name]]);
        if (profile.company) crisp.push(['set', 'user:company', [profile.company]]);
        // Tag with plan so you can see in Crisp who is free vs pro
        crisp.push(['set', 'session:segments', [[profile.plan || 'free']]]);
        crisp.push(['set', 'session:data', [[
          ['plan', profile.plan || 'free'],
          ['user_id', user.id],
        ]]]);
      } catch {
        // Non-critical, ignore errors
      }
    };

    return () => { s.remove(); };
  }, []);
  return null;
}
