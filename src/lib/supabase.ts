import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
throw new Error(
'Faltan las variables de entorno de Supabase. Comprueba el archivo .env.local.'
);
}

try {
  localStorage.removeItem('advent-test-mode')
  localStorage.removeItem('advent-test-day')
} catch (error) {
  if (!(error instanceof DOMException) || error.name !== 'SecurityError') {
    throw error
  }

  console.warn('No se pudo limpiar el almacenamiento local antiguo del calendario.')
}

export const supabase = createClient(
supabaseUrl,
supabasePublishableKey,
{
  auth: {
    persistSession: true,
  },
},
);
