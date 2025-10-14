import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPA_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPA_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠️ Faltan variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
console.log('✅ Supabase client initialized:', SUPABASE_URL)
