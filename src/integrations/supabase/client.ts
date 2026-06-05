import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Singleton pattern to prevent multiple instances during HMR
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

if (!supabaseInstance) {
  supabaseInstance = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "repurpose-auth",
        flowType: "pkce",
      },
    },
  );
}

export const supabase = supabaseInstance;
