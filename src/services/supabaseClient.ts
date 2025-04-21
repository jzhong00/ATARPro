import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Check if the variables are actually loaded
  console.error('Supabase URL or Anon Key is missing. Check your .env file and ensure the Vite server is running.');
  throw new Error('Supabase environment variables not found. Ensure .env is configured and accessible.');
}

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 