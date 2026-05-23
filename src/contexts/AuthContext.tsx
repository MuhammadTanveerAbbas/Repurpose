import { createContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { validateEnv } from "@/lib/env";

type Profile = {
  id: string;
  full_name: string | null;
  plan: string;
  projects_used_this_month: number;
  stripe_customer_id: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateEnv();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, plan, projects_used_this_month, stripe_customer_id")
      .eq("id", userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: userId, full_name: null, plan: 'free', projects_used_this_month: 0 })
          .select("id, full_name, plan, projects_used_this_month, stripe_customer_id")
          .single();
        
        if (!insertError && newProfile) {
          setProfile(newProfile as Profile | null);
        }
      }
    } else {
      setProfile(data as Profile | null);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    let settled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      try {
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth state change handler error:", err);
      } finally {
        if (!settled) {
          settled = true;
        }
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!settled) {
        settled = true;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        setLoading(false);
      }
    }).catch((err) => {
      console.error("getSession error:", err);
      if (!settled) {
        settled = true;
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
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
