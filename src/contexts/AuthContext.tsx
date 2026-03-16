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

// ВРЕМЕННЫЙ МОК-ПОЛЬЗОВАТЕЛЬ ДЛЯ ТЕСТИРОВАНИЯ (РОЛЬ: ADMIN)
// Администратор имеет доступ ко всем страницам системы
const MOCK_USER: User = {
  id: "mock-admin-id",
  email: "admin@test.com",
  full_name: "Тестовый Администратор",
  role: "admin", // Изменили роль на admin для доступа ко всем страницам
  status: "active",
  phone: "+7 999 000-00-00",
  rating: 5.0,
  experience_months: 24,
  is_on_shift: true,
  photo_url: null,
  created_at: new Date().toISOString()
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [loading, setLoading] = useState(false);

  // ВРЕМЕННО: Всегда возвращаем мок-пользователя с ролью admin
  useEffect(() => {
    console.log("🔓 AuthProvider: Using MOCK ADMIN user for testing");
    setUser(MOCK_USER);
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("Mock sign in for:", email);
    setUser(MOCK_USER);
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    console.log("Mock sign up for:", email);
    setUser(MOCK_USER);
  };

  const signOut = async () => {
    console.log("Mock sign out");
    setUser(null);
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