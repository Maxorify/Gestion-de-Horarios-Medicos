// Este archivo configura y exporta el cliente de Supabase para su uso en la aplicación.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://TU_PROYECTO.supabase.co';
const supabaseKey = 'TU_API_KEY_PUBLICA';

export const supabase = createClient(supabaseUrl, supabaseKey);
