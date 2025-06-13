// Este archivo configura y exporta el cliente de Supabase para su uso en la aplicación.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vmuwkrbxpybufwrrzxro.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtdXdrcmJ4cHlidWZ3cnJ6eHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzk0NTMsImV4cCI6MjA2NDY1NTQ1M30._iDjpEIvHNgFiLNjMIhXxjHivXfiTsFv24neidbsdnU';

export const supabase = createClient(supabaseUrl, supabaseKey);
