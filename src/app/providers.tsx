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

/** Tawk.to chat widget with logged-in user identification */
export function TawkChat() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Init Tawk API
    const tawk = window as unknown as Record<string, unknown>;
    tawk.Tawk_API = tawk.Tawk_API || {};
    tawk.Tawk_LoadStart = new Date();

    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = 'https://embed.tawk.to/69d247ef1772311c3585e36f/1jlemi0pt';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');

    // After widget loads, identify logged-in user
    s1.onload = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email, plan, company')
          .eq('user_id', user.id)
          .single();

        if (!profile) return;

        const TawkAPI = (window as unknown as { Tawk_API?: { setAttributes?: (attrs: Record<string, string>, cb?: () => void) => void } }).Tawk_API;
        if (TawkAPI?.setAttributes) {
          TawkAPI.setAttributes({
            name: profile.name || '',
            email: profile.email || '',
            plan: profile.plan || 'free',
            company: profile.company || '',
          }, () => {});
        }
      } catch {
        // Non-critical
      }
    };

    document.head.appendChild(s1);
    return () => { s1.remove(); };
  }, []);
  return null;
}
