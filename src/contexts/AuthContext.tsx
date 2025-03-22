import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, refreshSession, initializeAuth } from "@/integrations/supabase/client";
import { User, fetchUserProfile } from "@/services/userService";
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
  const authInitialized = useRef(false);
  const userProfileFetchAttempted = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSessionCheckRef = useRef<number>(0);
  const { toast } = useToast();

  // Simple logging for auth state
  const logAuthState = (action: string, details?: any) => {
    console.log(`[AUTH CONTEXT] ${action}`, details ? details : '');
  };

  const handleAuthChange = useCallback(async (userId: string | null) => {
    logAuthState("Auth state change", { userId });
    
    if (!userId) {
      setUser(null);
      return;
    }
    
    // Clear any existing fetch timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    userProfileFetchAttempted.current = true;
    
    // Set a timeout to ensure the fetch completes in a reasonable time
    fetchTimeoutRef.current = setTimeout(() => {
      logAuthState("User profile fetch timed out, using fallback");
      // If fetch is taking too long, try to use cached data
      const cachedUserJson = localStorage.getItem('user_profile');
      if (cachedUserJson) {
        try {
          const cachedUser = JSON.parse(cachedUserJson);
          if (cachedUser && cachedUser.id === userId) {
            logAuthState("Using cached profile due to fetch timeout");
            setUser(cachedUser);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error parsing cached user:", e);
        }
      }
      
      // Create minimal user object if no cache
      const minimalUser = {
        id: userId,
        username: "User",
        email: ""
      };
      setUser(minimalUser);
      setIsLoading(false);
    }, 3000); // 3 second timeout for initial fetch
    
    try {
      logAuthState("Fetching user profile for ID:", userId);
      const profile = await fetchUserProfile(userId);
      
      // Clear the timeout as we got a response
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      if (profile) {
        logAuthState("Setting user profile:", profile);
        setUser(profile);
        
        // Cache the profile
        localStorage.setItem('user_profile', JSON.stringify(profile));
      } else {
        // No profile found - this indicates a server error or no data
        logAuthState("No profile found for ID", userId);
        const cachedUserJson = localStorage.getItem('user_profile');
        
        if (cachedUserJson) {
          try {
            const cachedUser = JSON.parse(cachedUserJson);
            if (cachedUser.id === userId) {
              logAuthState("Using cached profile due to fetch failure");
              setUser(cachedUser);
            } else {
              setUser({ id: userId, username: "User", email: "" });
            }
          } catch (e) {
            console.error("Error parsing cached user on profile fetch failure:", e);
            setUser({ id: userId, username: "User", email: "" });
          }
        } else {
          setUser({ id: userId, username: "User", email: "" });
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      
      // If fetch fails, try to use cached profile
      const cachedUserJson = localStorage.getItem('user_profile');
      if (cachedUserJson) {
        try {
          const cachedUser = JSON.parse(cachedUserJson);
          if (cachedUser.id === userId) {
            logAuthState("Using cached profile after fetch error");
            setUser(cachedUser);
          } else {
            setUser({ id: userId, username: "User", email: "" });
          }
        } catch (e) {
          console.error("Error parsing cached user after fetch error:", e);
          setUser({ id: userId, username: "User", email: "" });
        }
      } else {
        setUser({ id: userId, username: "User", email: "" });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth and set up event listeners
  useEffect(() => {
    let isMounted = true;
    logAuthState("Initializing auth state...");
    
    // Initialize auth only once
    if (authInitialized.current) {
      logAuthState("Auth already initialized, skipping");
      return () => {};
    }
    
    authInitialized.current = true;
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logAuthState(`Auth state changed: ${event}`, session?.user?.id);
      
      if (!isMounted) return;
      
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            logAuthState('User SIGNED_IN event, updating user state', { userId: session.user.id });
            handleAuthChange(session.user.id);
          }
          break;
          
        case 'SIGNED_OUT':
          logAuthState('User SIGNED_OUT event, clearing user state');
          setUser(null);
          break;
          
        case 'USER_UPDATED':
          if (session?.user) {
            logAuthState('User updated, refreshing user data');
            handleAuthChange(session.user.id);
          }
          break;
          
        case 'INITIAL_SESSION':
          if (session?.user) {
            logAuthState('Initial session found, updating user state');
            handleAuthChange(session.user.id);
          } else {
            logAuthState('No initial session found');
            setUser(null);
            setIsLoading(false);
          }
          break;
          
        default:
          logAuthState(`Unhandled auth event: ${event}`);
          break;
      }
    });
    
    // Initial session check
    const checkInitialSession = async () => {
      try {
        // Use Supabase's getSession to check for an existing session
        const { data } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (data.session) {
          logAuthState("Found existing session:", data.session.user.id);
          await handleAuthChange(data.session.user.id);
        } else {
          logAuthState("No existing session found");
          setUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error during initial session check:", error);
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };
    
    // Initialize auth with better session handling
    initializeAuth()
      .then(result => {
        if (result.success && result.session) {
          logAuthState("Auth initialized with session:", result.session.user.id);
          if (isMounted) {
            handleAuthChange(result.session.user.id);
          }
        } else {
          logAuthState("Auth initialized but no session found");
          if (isMounted) {
            setUser(null);
            setIsLoading(false);
          }
        }
      })
      .catch(error => {
        console.error("Error initializing auth:", error);
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      });
    
    // Check for initial session
    checkInitialSession();
    
    // Add window focus event listener to verify session
    const handleFocus = async () => {
      // Don't check too frequently to avoid race conditions
      const now = Date.now();
      if (now - lastSessionCheckRef.current < 5000) {
        return; // Skip if checked within last 5 seconds
      }
      
      lastSessionCheckRef.current = now;
      
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (data.session) {
          // We have a valid session
          if (!user || user.id !== data.session.user.id) {
            // Handle case where session exists but our React state doesn't match
            logAuthState("Focus check: session found but user state mismatch");
            handleAuthChange(data.session.user.id);
          }
        } else if (user) {
          // We don't have a session but we have a user in state
          logAuthState("Focus check: no session but user in state, clearing");
          setUser(null);
        }
      } catch (error) {
        console.error("Error during focus session check:", error);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [handleAuthChange, user]);

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      logAuthState("Login attempt for:", email);
      
      // Initial validation
      if (!email || !password) {
        throw new Error("Email and password are required");
      }
      
      // First verify user credentials
      const response = await verifyUserCredentials(email, password);
      
      if ('error' in response && response.error) {
        throw response.error;
      }
      
      const userId = response.userId;
      if (!userId) {
        throw new Error("Invalid login credentials");
      }
      
      // Then authenticate with Supabase to get a session
      const authResponse = await authenticateWithSupabase(email, password);
      
      if ('error' in authResponse && authResponse.error) {
        throw authResponse.error;
      }
      
      if (!authResponse.user) {
        throw new Error("Authentication failed");
      }
      
      // NOTE: We don't need to call handleAuthChange here because the
      // the auth state change listener will handle it for us
            
    } catch (error: any) {
      console.error("Login error:", error);
      setIsLoading(false);
      setUser(null);
      
      // Format error for display
      if (error.message && error.message.includes("Email not confirmed")) {
        error.code = "email_not_confirmed";
      }
      
      throw error;
    }
  };

  // Signup with username, email, and password
  const signup = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      logAuthState("Signup attempt for:", email);
      
      // Initial validation
      if (!username || !email || !password) {
        throw new Error("Username, email, and password are required");
      }
      
      // Register the user
      const response = await signupUser(username, email, password);
      
      if ('error' in response && response.error) {
        throw response.error;
      }
      
      // No need to set user state as we require email confirmation
      toast({
        title: "Account created",
        description: "Please check your email to confirm your account.",
      });
      
      return;
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Format error for toast
      let errorMessage = error.message;
      if (error.code === "23505") {
        errorMessage = "Email or username already exists.";
      }
      
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setIsLoading(true);
      logAuthState("Logout attempt");
      
      const response = await signOutUser();
      
      if ('error' in response && response.error) {
        throw response.error;
      }
      
      // Reset state
      setUser(null);
      
      // Note: Auth state listener will handle cleanup
      
    } catch (error: any) {
      console.error("Logout error:", error);
      
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Resend confirmation email
  const resendConfirmationEmail = async (email: string) => {
    try {
      logAuthState("Resending confirmation email to:", email);
      
      // Initial validation
      if (!email) {
        throw new Error("Email is required");
      }
      
      const response = await resendEmail(email);
      
      if ('error' in response && response.error) {
        throw response.error;
      }
      
      return;
    } catch (error: any) {
      console.error("Resend confirmation error:", error);
      
      toast({
        title: "Failed to resend confirmation email",
        description: error.message,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        resendConfirmationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
