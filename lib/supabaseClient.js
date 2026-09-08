import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// true solo cuando .env.local tiene valores reales (no cuando faltan o siguen
// siendo el placeholder de .env.local.example).
export const isSupabaseConfigured =
  !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes("tu-proyecto");

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase no está configurado todavía (faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local). Usando datos de prueba."
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        // Next.js patches the global fetch() to cache requests by default.
        // Force every Supabase call to skip that cache, so we always get
        // fresh data instead of a stale response from an earlier deploy.
        fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }),
      },
    })
  : null;

// Nombre del bucket de Storage donde se guardan los PDFs de Incident Reports.
export const PDF_BUCKET = "incident-reports";