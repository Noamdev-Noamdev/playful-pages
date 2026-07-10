import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export type UserTier = "free" | "premium";

export interface UserProfile {
  id: string;
  email: string;
  tier: UserTier;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Fetch the tier from the profiles table. Falls back to "free" if the row
 * doesn't exist yet (e.g. trigger hasn't fired yet or table isn't created).
 */
async function fetchTier(userId: string): Promise<UserTier> {
  const { data, error } = await supabase.from("profiles").select("tier").eq("id", userId).single();

  if (error || !data) return "free";
  return (data.tier as UserTier) ?? "free";
}

/** Build a UserProfile from a Supabase User + tier. */
function buildProfile(user: User, tier: UserTier): UserProfile {
  return {
    id: user.id,
    email: user.email ?? "",
    tier,
  };
}

function getAuthRedirectUrl() {
  return typeof window === "undefined" ? undefined : window.location.origin;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /** Load profile from a Supabase session. */
  const loadProfile = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }
    const tier = await fetchTier(session.user.id);
    setUser(buildProfile(session.user, tier));
    setLoading(false);
  }, []);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session);
    });

    // 2. Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signUp = async (email: string, password: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const signInWithMagicLink = async (email: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const upgradeToPremium = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Update the profiles table
    await supabase.from("profiles").update({ tier: "premium" }).eq("id", session.user.id);

    // Update local state immediately
    setUser((prev) => (prev ? { ...prev, tier: "premium" } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithMagicLink,
        signInWithGoogle,
        logout,
        upgradeToPremium,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
