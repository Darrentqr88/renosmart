import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://obwcntliainlbxuzfeew.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2NudGxpYWlubGJ4dXpmZWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDk1MDQsImV4cCI6MjA4ODc4NTUwNH0.JUysYTQX9LMkdO2fiDjkhoOrh8rf4Km6tZB0ePsiYXA';

export const createClient = () =>
  createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
