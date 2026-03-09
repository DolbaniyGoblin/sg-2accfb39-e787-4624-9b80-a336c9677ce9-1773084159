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
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session ? "Session exists" : "No session");
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for ID:", userId);
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      console.log("User profile query result:", { data, error });

      if (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }

      if (!data) {
        console.error("No user profile found for ID:", userId);
        throw new Error("User profile not found");
      }

      console.log("User profile loaded successfully:", data);
      
      // Ensure all required fields for User type are present
      const userProfile: User = {
        id: data.id,
        email: data.email,
        full_name: data.full_name || "",
        // Cast role and status to specific union types
        role: (data.role || "courier") as "courier" | "dispatcher" | "admin",
        status: (data.status || "active") as "active" | "blocked",
        photo_url: data.photo_url,
        created_at: data.created_at,
        // Add defaults for new fields if they are null in DB
        phone: data.phone || "",
        rating: data.rating || 5.0,
        experience_months: data.experience_months || 0,
        is_on_shift: data.is_on_shift || false
      };

      setUser(userProfile);
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
    } finally {
      setLoading(false);
    }
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
    
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone
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

    console.log("Auth user created successfully:", authData.user.id);

    // Step 2: Create user profile in users table
    try {
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          role: "courier",
          status: "active",
          rating: 5.0,
          experience_months: 0,
          is_on_shift: false
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // If profile creation fails, we should still allow the user to continue
        // The trigger might have already created it
        console.warn("Profile creation failed, but user might still be created by trigger");
      } else {
        console.log("User profile created successfully in users table");
      }
    } catch (profileErr) {
      console.error("Exception during profile creation:", profileErr);
      // Non-fatal error - continue
    }

    console.log("Sign up completed successfully");
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