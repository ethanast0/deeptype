
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, fetchUserProfile, associateTempScriptsWithUser } from "@/services/userService";
import { 
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
  logout: () => Promise<void>;
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

  const handleAuthChange = useCallback(async (userId: string | null) => {
    console.log("Auth state change, user ID:", userId);
    
    if (!userId) {
      setUser(null);
      return;
    }
    
    try {
      const userProfile = await fetchUserProfile(userId);
      if (userProfile) {
        setUser(userProfile);
      } else {
        console.log("User profile not found for ID:", userId);
        setUser(null);
      }
    } catch (error) {
      console.error("Error handling auth change:", error);
      setUser(null);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    console.log("Initializing auth state...");
    let isMounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      
      if (!isMounted) return;
      
      setIsLoading(true);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (session?.user) {
        await handleAuthChange(session.user.id);
      }
      
      setIsLoading(false);
    });

    // Get initial session
    const checkSession = async () => {
      try {
        console.log("Checking initial session...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session?.user) {
          console.log("Found existing session:", session.user.id);
          await handleAuthChange(session.user.id);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    checkSession();
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthChange]);

  const login = async (email: string, password: string) => {
    console.log("Login attempt for:", email);
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
      
      toast({
        title: "Success",
        description: "You've been logged in successfully!",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    console.log("Signup attempt for:", email);
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
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log("Logging out...");
    setIsLoading(true);
    try {
      await signOutUser();
      setUser(null);
      toast({
        title: "Logged out",
        description: "You've been logged out successfully",
      });
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      await resendEmail(email);
      toast({
        title: "Email Sent",
        description: "A new confirmation email has been sent. Please check your inbox.",
      });
    } catch (error) {
      console.error("Error resending confirmation email:", error);
      throw error;
    }
  };

  const value = {
    user, 
    isLoading, 
    login, 
    signup, 
    logout, 
    resendConfirmationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
