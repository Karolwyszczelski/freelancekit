// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Adres i klucz anon dostępne po stronie klienta:
const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
