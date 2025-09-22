// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPA_URL,
  import.meta.env.VITE_SUPA_ANON_KEY
);

console.log('URL:', import.meta.env.VITE_SUPA_URL);
console.log('KEY:', import.meta.env.VITE_SUPA_ANON_KEY?.slice(0, 10) + '...');
console.log('Supabase client initialized');
