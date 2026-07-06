import { useEffect, useState, useRef, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { validateEnv } from "@/lib/env";
import { AuthContext, type Profile } from "@/contexts/auth-context";

const LOADING_TIMEOUT_MS = 8_000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    validateEnv();
  }, []);

  const clearStaleSession = () => {
    try {
      localStorage.removeItem("repurpose-auth");
    } catch {
      // non-fatal
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, plan, projects_used_this_month, stripe_customer_id")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: userId, full_name: null, plan: "free", projects_used_this_month: 0 })
          .select("id, full_name, plan, projects_used_this_month, stripe_customer_id")
          .single();

        if (!insertError && newProfile) {
          setProfile(newProfile as Profile);
        }
      }
    } else {
      setProfile(data as Profile);
    }
  };

  const verifySession = async (activeSession: Session): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.getUser(activeSession.access_token);
      if (error) {
        await supabase.auth.signOut();
        clearStaleSession();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const stripAuthParamsFromUrl = () => {
    const url = new URL(window.location.href);
    const paramsToRemove = ["code", "error", "error_description", "error_code"];
    let changed = false;
    for (const param of paramsToRemove) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState({}, "", url.toString());
    }
  };

  const finishInit = () => {
    if (!initialized.current) {
      initialized.current = true;
      stripAuthParamsFromUrl();
      setLoading(false);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        fetchProfile(nextSession.user.id).finally(finishInit);
      } else {
        setProfile(null);
        finishInit();
      }
    });

    supabase.auth
      .getSession()
      .then(async ({ data: { session: existingSession } }) => {
        if (existingSession?.user) {
          const valid = await verifySession(existingSession);
          if (!valid) {
            setSession(null);
            setUser(null);
            setProfile(null);
            finishInit();
            return;
          }
          setSession(existingSession);
          setUser(existingSession.user);
          fetchProfile(existingSession.user.id).finally(finishInit);
        } else {
          finishInit();
        }
      })
      .catch(() => {
        clearStaleSession();
        finishInit();
      });

    const timeoutId = setTimeout(() => {
      if (!initialized.current) {
        clearStaleSession();
        finishInit();
      }
    }, LOADING_TIMEOUT_MS);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setUser(null);
      setProfile(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};
