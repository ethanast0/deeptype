
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Provider } from "@supabase/supabase-js";
import * as bcrypt from 'bcryptjs';

type User = {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  resendConfirmationEmail: (email: string) => Promise<void>;
  signInWithAuth0: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const associateTempScriptsWithUser = async (user: User) => {
    const tempScripts = localStorage.getItem("temp_script");
    if (tempScripts) {
      try {
        const parsedScript = JSON.parse(tempScripts);
        
        const { data, error } = await supabase
          .from('scripts')
          .insert({
            user_id: user.id,
            title: parsedScript.name,
            content: JSON.stringify(parsedScript.quotes),
            category: 'Custom',
            created_by: user.id
          });
        
        if (error) {
          console.error("Error saving temp script to Supabase:", error);
          throw error;
        }
        
        localStorage.removeItem("temp_script");
      } catch (error) {
        console.error("Error processing temp script:", error);
      }
    }
  };

  const fetchUserProfile = async (id: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      
      if (data) {
        return {
          id: data.id,
          username: data.username,
          email: data.email,
          createdAt: data.created_at
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      return null;
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const userProfile = await fetchUserProfile(data.session.user.id);
        if (userProfile) {
          setUser(userProfile);
        }
      }
      setIsLoading(false);
    };
    
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          if (userProfile) {
            setUser(userProfile);
          }
        } else {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, email, password_hash, created_at')
        .eq('email', email)
        .single();
      
      if (userError || !userData) {
        console.error("Login error: User not found", userError);
        throw new Error("Invalid email or password");
      }
      
      const passwordMatch = await bcrypt.compare(password, userData.password_hash || '');
      
      if (!passwordMatch) {
        throw new Error("Invalid email or password");
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message === "Email not confirmed" || error.code === "email_not_confirmed") {
          throw {
            code: "email_not_confirmed",
            message: "Please check your inbox and confirm your email before logging in.",
            originalError: error
          };
        }
        
        console.error("Supabase login error:", error);
        throw error;
      }
      
      const userProfile: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        createdAt: userData.created_at
      };
      
      setUser(userProfile);
      
      await associateTempScriptsWithUser(userProfile);
      
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) {
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error("Failed to create user");
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          username,
          password_hash: passwordHash
        })
        .select()
        .single();
      
      if (userError) {
        console.error("Error creating user record:", userError);
        throw userError;
      }
      
      const newUser: User = {
        id: authData.user.id,
        username,
        email,
        createdAt: new Date().toISOString()
      };
      
      setUser(newUser);
      
      await associateTempScriptsWithUser(newUser);
      
    } catch (error: any) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      if (error) {
        throw error;
      }
      
      return;
    } catch (error) {
      console.error("Error resending confirmation email:", error);
      throw error;
    }
  };

  const signInWithAuth0 = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'auth0' as Provider,
        options: {
          redirectTo: window.location.origin,
        }
      });
      
      if (error) {
        console.error("Auth0 sign-in error:", error);
        throw error;
      }
      
      // User will be set by the onAuthStateChange listener after redirect
      
    } catch (error: any) {
      console.error("Auth0 sign-in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      signup, 
      logout, 
      resendConfirmationEmail,
      signInWithAuth0
    }}>
      {children}
    </AuthContext.Provider>
  );
};
