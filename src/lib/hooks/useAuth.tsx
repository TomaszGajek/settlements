import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabaseClient } from "@/db/supabase.client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provider komponentu zarządzającego stanem autentykacji
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(mapSupabaseError(error));
    }

    // Redirect handled by onAuthStateChange
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(mapSupabaseError(error));
    }

    // Auto-login after signup (Supabase default behavior)
    // Redirect handled by onAuthStateChange
  };

  const signOut = async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      throw new Error("Nie udało się wylogować");
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/confirm`,
    });

    if (error) {
      throw new Error(mapSupabaseError(error));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPasswordForEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook do dostępu do kontekstu autentykacji
 * @throws {Error} Jeśli użyty poza AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

/**
 * Helper function to map Supabase errors to user-friendly messages
 */
function mapSupabaseError(error: unknown): string {
  const errorMessage = (error as { message?: string })?.message || "";

  switch (errorMessage) {
    case "Invalid login credentials":
      return "Nieprawidłowy email lub hasło";
    case "User already registered":
      return "Użytkownik o tym adresie email już istnieje";
    case "Email not confirmed":
      return "Email nie został potwierdzony";
    case "Password should be at least 6 characters":
      return "Hasło musi mieć minimum 6 znaków";
    default:
      if (errorMessage.includes("Email")) {
        return "Nieprawidłowy format adresu email";
      }
      return "Wystąpił błąd. Spróbuj ponownie później";
  }
}
