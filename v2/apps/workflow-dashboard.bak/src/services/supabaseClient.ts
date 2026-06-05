import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Development: direct connection to local Supabase
// Production: use .env URL
const isDev = import.meta.env.DEV
const supabaseUrl = isDev
  ? 'http://127.0.0.1:54321'  // Direct to local Supabase (avoids Vite proxy port mismatch)
  : (import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321')
// In dev, anon key comes from .env (regenerate via: ./scripts/generate-anon-key.sh --env)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3ODUzODQ5MiwiZXhwIjoxNzc4NTQyMDkyfQ.SLcyO2e9AjiqfYVKwwIL5rjnghAnROlHa7URQ2S9GI4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export { supabase }
