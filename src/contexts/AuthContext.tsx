import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { validateEnv } from "@/lib/env";
import { AuthContext, type Profile } from "@/contexts/auth-context";

const LOADING_TIMEOUT_MS = 8_000;

const AUTH_STORAGE_KEY = "repurpose-auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const lastFetchedUserId = useRef<string | null>(null);

  useEffect(() => {
    validateEnv();
  }, []);

  const clearStaleSession = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // non-fatal
    }
  };

  const fetchProfile = useCallback(async (nextUser: User, force = false) => {
    if (!force && lastFetchedUserId.current === nextUser.id) return;
    lastFetchedUserId.current = nextUser.id;

    const metadataName =
      nextUser.user_metadata?.full_name ?? nextUser.user_metadata?.name ?? null;

    const selectColumns = "id, full_name, plan, projects_used_this_month, stripe_customer_id";

    const { data, error } = await supabase
      .from("profiles")
      .select(selectColumns)
      .eq("id", nextUser.id)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
      return;
    }

    if (error?.code === "PGRST116") {
      // No profile yet: create one on first login.
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: nextUser.id,
          full_name: metadataName,
          plan: "free",
          projects_used_this_month: 0,
        })
        .select(selectColumns)
        .single();

      if (!insertError && newProfile) {
        setProfile(newProfile as Profile);
        return;
      }
    }

    // Reset the dedupe guard so a later auth event can retry the fetch.
    if (lastFetchedUserId.current === nextUser.id) {
      lastFetchedUserId.current = null;
    }
  }, []);

  /**
   * Verifies the stored access token is still valid.
   * Only signs the user out on explicit auth rejections. Network failures must
   * NOT destroy a possibly-valid session (flaky connections would log people out).
   */
  const verifySession = async (activeSession: Session): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.getUser(activeSession.access_token);
      if (error) {
        const status = error.status ?? error.code;
        // Definitive rejections only: expired/invalid token or unknown user.
        if (
          status === 401 ||
          status === 403 ||
          error.message.toLowerCase().includes("invalid") ||
          error.message.toLowerCase().includes("expired")
        ) {
          await supabase.auth.signOut().catch(() => {});
          clearStaleSession();
          return false;
        }
        // Ambiguous failure: optimistically keep the session.
        return true;
      }
      return Boolean(data?.user);
    } catch {
      // Network error: keep the session rather than logging the user out.
      return true;
    }
  };

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user, true);
  }, [user, fetchProfile]);

  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;

    const handleSession = (nextSession: Session | null) => {
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        void fetchProfile(nextUser);
      } else {
        lastFetchedUserId.current = null;
        setProfile(null);
      }
    };

    supabase.auth
      .getSession()
      .then(async ({ data: { session: existingSession } }) => {
        if (existingSession?.user) {
          const valid = await verifySession(existingSession);
          if (!valid) {
            handleSession(null);
            finishInit();
            return;
          }
          handleSession(existingSession);
        }
        finishInit();
      })
      .catch(() => {
        finishInit();
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "TOKEN_REFRESHED") return; // already handled via INITIAL_SESSION / SIGNED_IN
      handleSession(nextSession);
      if (event === "SIGNED_OUT") {
        finishInit();
      }
    });
    authSubscription = subscription;

    const timeoutId = setTimeout(() => {
      if (!initialized.current) {
        finishInit();
      }
    }, LOADING_TIMEOUT_MS);

    function finishInit() {
      if (!initialized.current) {
        initialized.current = true;
        stripAuthParamsFromUrl();
        setLoading(false);
      }
    }

    return () => {
      authSubscription?.unsubscribe();
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Even if the server call fails, clear everything locally below so the
      // user never gets trapped in a half-signed-out state.
    }
    clearStaleSession();
    setSession(null);
    setUser(null);
    setProfile(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function stripAuthParamsFromUrl() {
  try {
    const url = new URL(window.location.href);
    const paramsToRemove = ["error", "error_description", "error_code"];
    let changed = false;
    for (const param of paramsToRemove) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    }
    // The PKCE "code" param is consumed by supabase-js during client
    // initialization, so by the time init finishes it is safe to clean up.
    if (url.searchParams.has("code")) {
      url.searchParams.delete("code");
      changed = true;
    }
    if (changed) {
      window.history.replaceState({}, "", url.toString());
    }
  } catch {
    // non-fatal
  }
}
