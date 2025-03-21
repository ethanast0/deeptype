
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  fetchUserProfile, 
  handleAuth0Callback, 
  signInWithAuth0,
  logoutFromAuth
} from "@/utils/authUtils";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signInWithAuth0: () => Promise<void>;
  logout: () => Promise<void>;
  processAuthCallback: () => Promise<void>;
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        
        // We'll use our utility functions to check authentication status
        try {
          const authUser = await handleAuth0Callback();
          if (authUser) {
            setUser(authUser);
          }
        } catch (error) {
          console.error("Error initializing auth:", error);
          toast({
            title: "Authentication Error",
            description: "There was an issue with your session. Please try logging in again.",
            variant: "destructive",
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error in initAuth:", error);
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  useEffect(() => {
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

  const processAuthCallback = async (): Promise<void> => {
    try {
      const authUser = await handleAuth0Callback();
      if (authUser) {
        setUser(authUser);
      }
    } catch (error) {
      console.error("Error processing Auth0 callback:", error);
      throw error;
    }
  };

  const handleSignInWithAuth0 = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await signInWithAuth0();
      // Auth0 will handle the redirect
    } catch (error: any) {
      console.error("Auth0 sign-in error:", error);
      toast({
        title: "Error",
        description: "Failed to sign in with Auth0. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      throw error;
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logoutFromAuth();
      setUser(null);
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      signInWithAuth0: handleSignInWithAuth0,
      logout: handleLogout,
      processAuthCallback
    }}>
      {children}
    </AuthContext.Provider>
  );
};
