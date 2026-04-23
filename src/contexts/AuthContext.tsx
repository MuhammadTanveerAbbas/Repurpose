import { createContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  plan: string;
  projects_used_this_month: number;
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

  const fetchProfile = async (userId: string) => {
    console.log("🔍 Fetching profile for user:", userId);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, plan, projects_used_this_month")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("❌ Error fetching profile:", error);
      // If profile doesn't exist, create it
      if (error.code === 'PGRST116') {
        console.log("📝 Profile not found, creating new profile...");
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: userId, full_name: null, plan: 'free', projects_used_this_month: 0 })
          .select("id, full_name, plan, projects_used_this_month")
          .single();
        
        if (insertError) {
          console.error("❌ Error creating profile:", insertError);
        } else {
          console.log("✅ Profile created:", newProfile);
          setProfile(newProfile as Profile | null);
        }
      }
    } else {
      console.log("✅ Profile fetched:", data);
      setProfile(data as Profile | null);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    }, 3000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
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
