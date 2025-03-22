import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, refreshSession, initializeAuth, checkPersistedSession } from "@/integrations/supabase/client";
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
  const authCleanupRef = useRef<(() => void) | null>(null);
  const initializationCompleted = useRef(false);
  const { toast } = useToast();

  const handleAuthChange = useCallback(async (userId: string | null) => {
    console.log("Auth state change, user ID:", userId);
    
    if (!userId) {
      setUser(null);
      return;
    }
    
    try {
      console.log("Fetching user profile for ID:", userId);
      const userProfile = await fetchUserProfile(userId);
      if (userProfile) {
        console.log("Setting user profile:", userProfile);
        setUser(userProfile);
        // Store user ID in localStorage for redundant persistence
        localStorage.setItem('supabase.auth.user.id', userId);
      } else {
        console.log("User profile not found for ID:", userId);
        setUser(null);
        localStorage.removeItem('supabase.auth.user.id');
      }
    } catch (error) {
      console.error("Error handling auth change:", error);
      setUser(null);
      localStorage.removeItem('supabase.auth.user.id');
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (initializationCompleted.current) {
      console.log("Auth already initialized, skipping");
      return;
    }
    
    console.log("Initializing auth state...");
    initializationCompleted.current = true;
    let isMounted = true;
    
    // Initialize cross-tab auth support
    const authHandler = initializeAuth();
    if (authHandler && authHandler.cleanup) {
      authCleanupRef.current = authHandler.cleanup;
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth state changed: ${event}`, session?.user?.id);
      
      if (!isMounted) return;
      
      setIsLoading(true);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('supabase.auth.user.id');
        console.log('User signed out, cleared user state');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          console.log(`User ${event} event, updating user state`);
          await handleAuthChange(session.user.id);
        }
      }
      
      setIsLoading(false);
    });

    // Initial session check - critical for page refresh
    const checkSession = async () => {
      try {
        console.log("Checking for existing session...");
        
        // Use our enhanced session checking function
        const session = await checkPersistedSession();
        
        if (!isMounted) return;
        
        if (session?.user) {
          console.log("Found existing session:", session.user.id);
          await handleAuthChange(session.user.id);
        } else {
          console.log("No existing session found");
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Add window focus event listener to refresh session
    const handleFocus = async () => {
      if (!user) return; // Only refresh if we think we're logged in
      
      console.log("Window focused, refreshing session");
      try {
        const refreshedSession = await refreshSession();
        if (refreshedSession?.user) {
          await handleAuthChange(refreshedSession.user.id);
        } else {
          // No valid session found on focus, but we thought we were logged in
          console.log("Session expired, clearing user state");
          setUser(null);
          localStorage.removeItem('supabase.auth.user.id');
        }
      } catch (error) {
        console.error("Error refreshing session on focus:", error);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Also set an interval to periodically refresh the token while tab is active
    const tokenRefreshInterval = setInterval(async () => {
      if (user) {
        console.log("Performing periodic token refresh");
        await refreshSession();
      }
    }, 10 * 60 * 1000); // Every 10 minutes
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      clearInterval(tokenRefreshInterval);
      
      // Clean up cross-tab auth handler
      if (authCleanupRef.current) {
        authCleanupRef.current();
        authCleanupRef.current = null;
      }
    };
  }, [handleAuthChange, user]);

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
      
      // Store user ID for redundant persistence
      localStorage.setItem('supabase.auth.user.id', userData.id);
      
      // Associate any temporary scripts with the user
      await associateTempScriptsWithUser(userProfile);
      
      toast({
        title: "Success",
        description: "You've been logged in successfully!",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      setUser(null);
      localStorage.removeItem('supabase.auth.user.id');
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
      
      // Store user ID for redundant persistence
      localStorage.setItem('supabase.auth.user.id', userData.id);
      
      // Associate any temporary scripts with the user
      await associateTempScriptsWithUser(newUser);
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      setUser(null);
      localStorage.removeItem('supabase.auth.user.id');
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
      localStorage.removeItem('supabase.auth.user.id');
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
