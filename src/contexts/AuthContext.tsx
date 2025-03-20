
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        
        if (session?.user) {
          // Check if the user exists in our users table
          const userProfile = await fetchUserProfile(session.user.id);
          
          if (userProfile) {
            setUser(userProfile);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Check if the user exists in our users table
        const userProfile = await fetchUserProfile(session.user.id);
        
        if (userProfile) {
          setUser(userProfile);
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        const userProfile = await fetchUserProfile(data.user.id);
        
        if (userProfile) {
          setUser(userProfile);
          
          // Associate any temporary scripts with this user
          await associateTempScriptsWithUser(userProfile);
        }
      }
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
      
      // Create a record in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          username
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
