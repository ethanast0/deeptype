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
  const userProfileFetchAttempted = useRef(false);
  const { toast } = useToast();

  const handleAuthChange = useCallback(async (userId: string | null) => {
    console.log("Auth state change, user ID:", userId);
    
    if (!userId) {
      setUser(null);
      return;
    }
    
    try {
      console.log("Fetching user profile for ID:", userId);
      userProfileFetchAttempted.current = true;
      
      // Try to get the user profile
      const userProfile = await fetchUserProfile(userId);
      
      if (userProfile) {
        console.log("Setting user profile:", userProfile);
        setUser(userProfile);
        // Store user ID in localStorage for redundant persistence
        localStorage.setItem('supabase.auth.user.id', userId);
      } else {
        console.log("User profile not found for ID:", userId);
        
        // If we have a cached user, use it
        const cachedUserJson = localStorage.getItem('cached_user_profile');
        if (cachedUserJson) {
          try {
            const cachedUser = JSON.parse(cachedUserJson) as User;
            if (cachedUser.id === userId) {
              console.log("Using cached user profile as fallback:", cachedUser);
              setUser(cachedUser);
              return;
            }
          } catch (e) {
            console.error("Error parsing cached user:", e);
          }
        }
        
        // If no user profile found and no cached user, log out
        setUser(null);
        localStorage.removeItem('supabase.auth.user.id');
        
        // If we've attempted to fetch the user profile multiple times without success,
        // try to sign out and redirect to login as a last resort
        if (userProfileFetchAttempted.current) {
          console.log("Multiple failed attempts to fetch user profile. Signing out...");
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error("Error handling auth change:", error);
      // Don't clear the user on error to prevent flickering
      // Only clear if there was no previous user
      if (!user) {
        setUser(null);
        localStorage.removeItem('supabase.auth.user.id');
      }
    }
  }, [user]);

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
      
      // Using a switch statement for better event handling
      switch (event) {
        case 'SIGNED_OUT':
          setUser(null);
          localStorage.removeItem('supabase.auth.user.id');
          console.log('User signed out, cleared user state');
          break;
          
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          if (session?.user) {
            console.log(`User ${event} event, updating user state`);
            // Only trigger handleAuthChange if the event is significant
            await handleAuthChange(session.user.id);
          }
          break;
          
        case 'INITIAL_SESSION':
          // For initial session, we'll handle it specifically in the checkSession function
          break;
          
        default:
          console.log(`Unhandled auth event: ${event}`);
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
          // But check localStorage one more time for redundancy
          const storedUserId = localStorage.getItem('supabase.auth.user.id');
          if (storedUserId) {
            console.log("Found stored user ID, attempting to restore session");
            const cachedUserJson = localStorage.getItem('cached_user_profile');
            
            if (cachedUserJson) {
              try {
                const cachedUser = JSON.parse(cachedUserJson) as User;
                if (cachedUser.id === storedUserId) {
                  console.log("Using cached user profile for stored ID:", cachedUser);
                  setUser(cachedUser);
                  // Attempt to refresh session in background
                  refreshSession().catch(e => console.error("Error refreshing session:", e));
                }
              } catch (e) {
                console.error("Error parsing cached user:", e);
                setUser(null);
              }
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
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
          // Just update the timestamp in localStorage to indicate activity
          // but don't trigger a full user profile fetch unless necessary
          localStorage.setItem('supabase.auth.last_refresh', Date.now().toString());
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
      
      // Store the user profile in cache and memory
      localStorage.setItem('cached_user_profile', JSON.stringify(userProfile));
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
      
      // Store the user profile in cache and memory
      localStorage.setItem('cached_user_profile', JSON.stringify(newUser));
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
      localStorage.removeItem('cached_user_profile');
      toast({
        title: "Logged out",
        description: "You've been logged out successfully",
      });
    } catch (error) {
      console.error("Error during logout:", error);
      // Force clean local storage even if API fails
      setUser(null);
      localStorage.removeItem('supabase.auth.user.id');
      localStorage.removeItem('cached_user_profile');
      toast({
        title: "Error",
        description: "There was an issue logging out, but your local session has been cleared.",
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
