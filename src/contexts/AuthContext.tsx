
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
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

  // Helper function to associate temporary scripts with user
  const associateTempScriptsWithUser = async (user: User) => {
    const tempScripts = localStorage.getItem("temp_script");
    if (tempScripts) {
      try {
        const parsedScript = JSON.parse(tempScripts);
        
        // Insert the script into Supabase
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
        
        // Clear the temp script from localStorage
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

  // Check for an existing session on component mount
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
    
    // Listen for auth state changes
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
      // Fetch the user record to get the password hash
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, email, password_hash, created_at')
        .eq('email', email)
        .single();
      
      if (userError || !userData) {
        console.error("Login error: User not found", userError);
        throw new Error("Invalid email or password");
      }
      
      // Compare the provided password with the stored hash
      const passwordMatch = await bcrypt.compare(password, userData.password_hash || '');
      
      if (!passwordMatch) {
        throw new Error("Invalid email or password");
      }
      
      // If password matches, sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Supabase login error:", error);
        throw error;
      }
      
      // Set the user state
      const userProfile: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        createdAt: userData.created_at
      };
      
      setUser(userProfile);
      
      // Associate any temporary scripts with this user
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
      // Hash the password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Sign up with Supabase Auth
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
      
      // Create a record in our users table with the hashed password
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          username,
          password_hash: passwordHash
        });
      
      if (userError) {
        // If there was an error creating the user record, we should delete the auth user
        console.error("Error creating user record:", userError);
        throw userError;
      }
      
      // Set the user in state
      const newUser: User = {
        id: authData.user.id,
        username,
        email,
        createdAt: new Date().toISOString()
      };
      
      setUser(newUser);
      
      // Associate any temporary scripts with this user
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
