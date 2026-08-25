import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://adzwarjoradodbdzlldu.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkendhcmpvcmFkb2RiZHpsbGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NTE5MTYsImV4cCI6MjEwMzAyNzkxNn0.yhznaMtPssjrW3ygY9Ev4mvUXwTZ19QvfGYtXPQOgkE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
