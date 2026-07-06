import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  full_name: string | null;
  plan: string;
  projects_used_this_month: number;
  stripe_customer_id: string | null;
};

export type AuthContextType = {
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
