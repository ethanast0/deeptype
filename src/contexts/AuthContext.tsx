
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, fetchUserProfile, associateTempScriptsWithUser } from "@/services/userService";
import { 
  UserCredentials, 
  SignupCredentials,
  authenticateWithSupabase, 
  verifyUserCredentials, 
  signupUser, 
  signOutUser,
  resendConfirmationEmail as resendEmail
} from "@/services/authService";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  resendConfirmationEmail: (email: string) => Promise<void>;
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

  // Initialize auth state and setup listeners
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        
        // First set up auth state listener to catch auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("Auth state changed:", event, session?.user?.id);
            
            if (!mounted) return;
            
            if (session?.user) {
              const userProfile = await fetchUserProfile(session.user.id);
              if (userProfile) {
                setUser(userProfile);
              } else {
                console.log("User profile not found for ID:", session.user.id);
                setUser(null);
              }
            } else {
              setUser(null);
            }
            
            setIsLoading(false);
          }
        );

        // Then check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            console.log("Found existing session:", session.user.id);
            const userProfile = await fetchUserProfile(session.user.id);
            if (userProfile) {
              setUser(userProfile);
            } else {
              console.log("User profile not found for ID in initial check:", session.user.id);
              setUser(null);
            }
          }
          
          setIsLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Verify user credentials in our database
      const userData = await verifyUserCredentials(email, password);
      
      // Authenticate with Supabase
      await authenticateWithSupabase(email, password);
      
      // Create user object
      const userProfile: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        createdAt: userData.created_at
      };
      
      setUser(userProfile);
      
      // Associate any temporary scripts with the user
      await associateTempScriptsWithUser(userProfile);
      
    } catch (error: any) {
      console.error("Login error:", error);
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Sign up the user
      const { userData } = await signupUser(username, email, password);
      
      // Create user object
      const newUser: User = {
        id: userData.id,
        username,
        email,
        createdAt: userData.created_at
      };
      
      setUser(newUser);
      
      // Associate any temporary scripts with the user
      await associateTempScriptsWithUser(newUser);
      
    } catch (error: any) {
      console.error("Signup error:", error);
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      await resendEmail(email);
    } catch (error) {
      console.error("Error resending confirmation email:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      signup, 
      logout, 
      resendConfirmationEmail 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
