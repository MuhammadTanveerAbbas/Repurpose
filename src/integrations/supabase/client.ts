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
      global: {
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(15000), // 15 second timeout
          });
        },
      },
    },
  );

  // Clear stale session storage only on explicit sign out
  supabaseInstance.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      localStorage.removeItem("repurpose-auth");
    }
  });
}

export const supabase = supabaseInstance;
