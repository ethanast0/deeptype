import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, refreshSession, initializeAuth, checkPersistedSession } from "@/integrations/supabase/client";
import { User, fetchUserProfile, associateTempScriptsWithUser } from "@/services/userService";
import { 
  authenticateWithSupabase, 
  verifyUserCredentials, 
  signupUser, 
  signOutUser,
  resendConfirmationEmail as resendEmail,
  getCurrentSession
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
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delayedProfileFetchRef = useRef<NodeJS.Timeout | null>(null);
  const lastSessionCheckRef = useRef<number>(0);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Enhanced logging for auth state changes
  const logAuthState = (action: string, details?: any) => {
    console.log(`[AUTH CONTEXT] ${action}`, details ? details : '');
  };

  const handleAuthChange = useCallback(async (userId: string | null) => {
    logAuthState("Auth state change", { userId });
    
    if (!userId) {
      setUser(null);
      return;
    }
    
    // Store the user ID in localStorage for redundancy
    if (userId) {
      localStorage.setItem('supabase.auth.user.id', userId);
      localStorage.setItem('backup:supabase.auth.user.id', userId);
    }
    
    // Clear any existing fetch timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Clear any delayed profile fetch
    if (delayedProfileFetchRef.current) {
      clearTimeout(delayedProfileFetchRef.current);
    }
    
    // Set a new timeout to ensure the fetch completes in a reasonable time
    fetchTimeoutRef.current = setTimeout(() => {
      logAuthState("User profile fetch timed out, using fallback");
      // If fetch is taking too long, try to use cached data or minimal data
      const cachedUserJson = localStorage.getItem('cached_user_profile');
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
          console.error("Error parsing cached user during timeout:", e);
        }
      }
      
      // If no cached data, create minimal user object
      const minimalUser = {
        id: userId,
        username: "User", // Will be updated when fetch succeeds
        email: "user@example.com" // Will be updated when fetch succeeds
      };
      logAuthState("Using minimal user profile:", minimalUser);
      setUser(minimalUser);
      setIsLoading(false);
      
      // Schedule a delayed retry of the profile fetch
      delayedProfileFetchRef.current = setTimeout(() => {
        logAuthState("Retrying profile fetch in background");
        fetchUserProfile(userId)
          .then(profile => {
            if (profile) {
              logAuthState("Background fetch succeeded, updating user");
              setUser(profile);
              
              // Update cached profile
              localStorage.setItem('cached_user_profile', JSON.stringify(profile));
            }
          })
          .catch(e => console.error("Background profile fetch failed:", e));
      }, 5000); // Try again after 5 seconds
    }, 3000); // 3 second timeout for initial fetch
    
    try {
      logAuthState("Fetching user profile for ID:", userId);
      userProfileFetchAttempted.current = true;
      
      // Try to get the user profile
      const userProfile = await fetchUserProfile(userId);
      
      // Clear timeout since fetch completed
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      if (userProfile) {
        logAuthState("Setting user profile:", userProfile);
        setUser(userProfile);
        
        // Cache the profile for future use
        localStorage.setItem('cached_user_profile', JSON.stringify(userProfile));
        
        // Store user ID in localStorage for redundant persistence
        localStorage.setItem('supabase.auth.user.id', userId);
        localStorage.setItem('backup:supabase.auth.user.id', userId);
      } else {
        logAuthState("User profile not found for ID:", userId);
        
        // If we have a cached user, use it
        const cachedUserJson = localStorage.getItem('cached_user_profile');
        if (cachedUserJson) {
          try {
            const cachedUser = JSON.parse(cachedUserJson) as User;
            if (cachedUser.id === userId) {
              logAuthState("Using cached user profile as fallback:", cachedUser);
              setUser(cachedUser);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.error("Error parsing cached user:", e);
          }
        }
        
        // If no user profile found and no cached user, create a minimal profile
        // This prevents the user from being logged out if the profile fetch fails
        const minimalUser = {
          id: userId,
          username: "User", // Generic name
          email: "user@example.com", // Generic email
        };
        logAuthState("Using minimal user profile:", minimalUser);
        setUser(minimalUser);
        localStorage.setItem('cached_user_profile', JSON.stringify(minimalUser));
        
        // Don't redirect to login, just maintain session with minimal data
        localStorage.setItem('supabase.auth.user.id', userId);
        localStorage.setItem('backup:supabase.auth.user.id', userId);
      }
    } catch (error) {
      console.error("Error handling auth change:", error);
      
      // Clear timeout since fetch completed (with error)
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      // Don't clear the user on error to prevent flickering
      // Only clear if there was no previous user
      if (!user) {
        // Try to use cached user as fallback
        const cachedUserJson = localStorage.getItem('cached_user_profile');
        if (cachedUserJson) {
          try {
            const cachedUser = JSON.parse(cachedUserJson) as User;
            if (cachedUser.id === userId) {
              logAuthState("Using cached user after error:", cachedUser);
              setUser(cachedUser);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.error("Error parsing cached user during error recovery:", e);
          }
        }
        
        // Last resort - create minimal user to maintain session
        const minimalUser = {
          id: userId,
          username: "User", // Generic name
          email: "user@example.com", // Generic email
        };
        logAuthState("Using minimal user profile after error:", minimalUser);
        setUser(minimalUser);
        localStorage.setItem('cached_user_profile', JSON.stringify(minimalUser));
        localStorage.setItem('supabase.auth.user.id', userId);
        localStorage.setItem('backup:supabase.auth.user.id', userId);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Function to check session status explicitly
  const checkSessionStatus = useCallback(async (force = false) => {
    const now = Date.now();
    // Don't check too frequently unless forced
    if (!force && now - lastSessionCheckRef.current < 10000) {
      return;
    }
    
    lastSessionCheckRef.current = now;
    logAuthState("Performing explicit session check");
    
    try {
      // Use our helper to check for an existing session
      const session = await getCurrentSession();
      
      if (session?.user) {
        // We have a user, ensure we have the user profile
        logAuthState("Session check found valid session:", session.user.id);
        
        // If no user is set or user ID doesn't match, update it
        if (!user || user.id !== session.user.id) {
          await handleAuthChange(session.user.id);
        }
      } else if (user) {
        // We thought we had a user but the session is gone, clear the state
        logAuthState("Session check found no valid session but had user state, clearing");
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking session status:", error);
    }
  }, [handleAuthChange, user]);

  // Initialize auth state
  useEffect(() => {
    if (initializationCompleted.current) {
      logAuthState("Auth already initialized, skipping");
      return;
    }
    
    logAuthState("Initializing auth state...");
    initializationCompleted.current = true;
    let isMounted = true;
    
    // Initialize cross-tab auth support
    const authHandler = initializeAuth();
    if (authHandler && authHandler.cleanup) {
      authCleanupRef.current = authHandler.cleanup;
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logAuthState(`Auth state changed: ${event}`, session?.user?.id);
      
      if (!isMounted) return;
      
      // Using a switch statement for better event handling
      switch (event) {
        case 'SIGNED_OUT':
          setUser(null);
          localStorage.removeItem('supabase.auth.user.id');
          localStorage.removeItem('backup:supabase.auth.user.id');
          localStorage.removeItem('cached_user_profile');
          logAuthState('User signed out, cleared user state');
          break;
          
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          if (session?.user) {
            logAuthState(`User ${event} event, updating user state`);
            // Only trigger handleAuthChange if the event is significant
            await handleAuthChange(session.user.id);
          }
          break;
          
        case 'INITIAL_SESSION':
          // For initial session, handle it
          if (session?.user) {
            logAuthState('Initial session found, updating user state');
            await handleAuthChange(session.user.id);
          }
          break;
          
        default:
          logAuthState(`Unhandled auth event: ${event}`);
      }
      
      setIsLoading(false);
    });

    // Initial session check - critical for page refresh
    const checkSession = async () => {
      try {
        logAuthState("Checking for existing session...");
        setIsLoading(true);
        
        // Use our enhanced session checking function
        const session = await checkPersistedSession();
        
        if (!isMounted) return;
        
        if (session?.user) {
          logAuthState("Found existing session:", session.user.id);
          await handleAuthChange(session.user.id);
        } else {
          logAuthState("No existing session found");
          // But check localStorage one more time for redundancy
          const storedUserId = localStorage.getItem('supabase.auth.user.id') || 
                              localStorage.getItem('backup:supabase.auth.user.id');
                              
          if (storedUserId) {
            logAuthState("Found stored user ID, attempting to restore session");
            const cachedUserJson = localStorage.getItem('cached_user_profile');
            
            if (cachedUserJson) {
              try {
                const cachedUser = JSON.parse(cachedUserJson) as User;
                if (cachedUser.id === storedUserId) {
                  logAuthState("Using cached user profile for stored ID:", cachedUser);
                  setUser(cachedUser);
                  // Attempt to refresh session in background
                  refreshSession().catch(e => console.error("Error refreshing session:", e));
                }
              } catch (e) {
                console.error("Error parsing cached user:", e);
                setUser(null);
              }
            } else {
              // Try to get the user profile
              try {
                const userProfile = await fetchUserProfile(storedUserId);
                if (userProfile) {
                  logAuthState("Fetched user profile for stored ID:", userProfile);
                  setUser(userProfile);
                  localStorage.setItem('cached_user_profile', JSON.stringify(userProfile));
                } else {
                  setUser(null);
                }
              } catch (e) {
                console.error("Error fetching profile for stored ID:", e);
                setUser(null);
              }
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
        
        // Attempt to recover using stored user ID if available
        const storedUserId = localStorage.getItem('supabase.auth.user.id') || 
                            localStorage.getItem('backup:supabase.auth.user.id');
                            
        if (storedUserId && isMounted) {
          logAuthState("Error during session check, using stored user ID:", storedUserId);
          
          // Try to use cached profile
          const cachedUserJson = localStorage.getItem('cached_user_profile');
          if (cachedUserJson) {
            try {
              const cachedUser = JSON.parse(cachedUserJson) as User;
              if (cachedUser.id === storedUserId) {
                logAuthState("Using cached user during session check error:", cachedUser);
                setUser(cachedUser);
                setIsLoading(false);
                return;
              }
            } catch (e) {
              console.error("Error parsing cached user during recovery:", e);
            }
          }
          
          // Last resort - create minimal user
          const minimalUser = {
            id: storedUserId,
            username: "User", // Generic name
            email: "user@example.com", // Generic email
          };
          logAuthState("Using minimal user during session check error:", minimalUser);
          setUser(minimalUser);
        } else if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up a repeating session check at a reasonable interval
    // This helps ensure our React state stays in sync with Supabase
    sessionCheckIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkSessionStatus();
      }
    }, 30000); // Check every 30 seconds when visible
    
    // Add window focus event listener to refresh session
    const handleFocus = async () => {
      logAuthState("Window focused, checking session state");
      checkSessionStatus(true); // Force a check on focus
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Also set an interval to periodically refresh the token while tab is active
    const tokenRefreshInterval = setInterval(async () => {
      if (user && document.visibilityState === 'visible') {
        logAuthState("Performing periodic token refresh");
        try {
          await refreshSession();
        } catch (e) {
          console.error("Error in periodic token refresh:", e);
          // If token refresh fails, double-check our session state
          checkSessionStatus(true);
        }
      }
    }, 9 * 60 * 1000); // Every 9 minutes (just under typical 10min JWT expiry)
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      clearInterval(tokenRefreshInterval);
      
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
      
      // Clean up fetch timeout if it exists
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Clean up delayed profile fetch if it exists
      if (delayedProfileFetchRef.current) {
        clearTimeout(delayedProfileFetchRef.current);
      }
      
      // Clean up cross-tab auth handler
      if (authCleanupRef.current) {
        authCleanupRef.current();
        authCleanupRef.current = null;
      }
    };
  }, [handleAuthChange, checkSessionStatus, user]);

  const login = async (email: string, password: string) => {
    logAuthState("Login attempt for:", email);
    
    // Check if we already have an active session to avoid duplicate login
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      logAuthState("Already have active session, fetching profile instead of login");
      
      try {
        // Just update the user profile for the existing session
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          setUser(profile);
          localStorage.setItem('cached_user_profile', JSON.stringify(profile));
          toast({
            title: "Already logged in",
            description: "You are already logged in, welcome back!",
          });
          return;
        }
      } catch (e) {
        console.error("Error fetching profile for existing session:", e);
        // Continue with login as fallback
      }
    }
    
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
      localStorage.setItem('backup:supabase.auth.user.id', userData.id);
      
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
      localStorage.removeItem('backup:supabase.auth.user.id');
      localStorage.removeItem('cached_user_profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    logAuthState("Signup attempt for:", email);
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
      localStorage.setItem('backup:supabase.auth.user.id', userData.id);
      
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
      localStorage.removeItem('backup:supabase.auth.user.id');
      localStorage.removeItem('cached_user_profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    logAuthState("Logging out...");
    setIsLoading(true);
    try {
      await signOutUser();
      setUser(null);
      localStorage.removeItem('supabase.auth.user.id');
      localStorage.removeItem('backup:supabase.auth.user.id');
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
      localStorage.removeItem('backup:supabase.auth.user.id');
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
