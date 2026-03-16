import { createBrowserClient } from '@supabase/ssr';

// Public keys — safe to hardcode (already visible in client JS bundle)
export const createClient = () =>
  createBrowserClient(
    'https://obwcntliainlbxuzfeew.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2NudGxpYWlubGJ4dXpmZWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDk1MDQsImV4cCI6MjA4ODc4NTUwNH0.JUysYTQX9LMkdO2fiDjkhoOrh8rf4Km6tZB0ePsiYXA'
  );
