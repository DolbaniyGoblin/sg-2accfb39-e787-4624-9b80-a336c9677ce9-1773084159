import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session ? "Session exists" : "No session");
      if (session?.user) {
        setUserFromAuthUser(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session ? "Session exists" : "No session");
      if (session?.user) {
        setUserFromAuthUser(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setUserFromAuthUser = (authUser: SupabaseUser) => {
    console.log("Setting user from auth.users:", authUser);
    
    // Получаем данные из auth.users (гарантированно работает)
    const userProfile: User = {
      id: authUser.id,
      email: authUser.email || "",
      full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Пользователь",
      // Роль берём из метаданных (устанавливается при регистрации)
      role: (authUser.user_metadata?.role || "courier") as "courier" | "dispatcher" | "admin",
      status: "active" as const,
      phone: authUser.user_metadata?.phone || authUser.phone || "",
      rating: authUser.user_metadata?.rating || 5.0,
      experience_months: authUser.user_metadata?.experience_months || 0,
      is_on_shift: false,
      photo_url: authUser.user_metadata?.photo_url || null,
      created_at: authUser.created_at || new Date().toISOString()
    };

    console.log("User profile constructed:", userProfile);
    setUser(userProfile);
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    console.log("Attempting sign in for:", email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Sign in error:", error);
      throw error;
    }
    console.log("Sign in successful");
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    console.log("Attempting sign up for:", email);
    
    // Создаём пользователя с метаданными
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role: "courier", // По умолчанию все новые пользователи — курьеры
          rating: 5.0,
          experience_months: 0
        }
      }
    });
    
    if (authError) {
      console.error("Auth sign up error:", authError);
      throw authError;
    }

    if (!authData.user) {
      console.error("No user data returned from signUp");
      throw new Error("Registration failed - no user data");
    }

    console.log("Sign up completed successfully:", authData.user.id);
  };

  const signOut = async () => {
    console.log("Signing out");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      throw error;
    }
    console.log("Sign out successful");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}