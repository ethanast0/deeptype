
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, auth0 } from "@/integrations/supabase/client";
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
          username: data.username || data.email.split('@')[0], // Use email username as fallback
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
    const initAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated with Auth0
        const isAuthenticated = await auth0.isAuthenticated();
        
        if (isAuthenticated) {
          // Get user info from Auth0
          const auth0User = await auth0.getUser();
          
          if (auth0User && auth0User.sub) {
            try {
              // Get ID token for Supabase (this is different from the access token)
              const claims = await auth0.getIdTokenClaims();
              if (claims && claims.__raw) {
                const token = claims.__raw;
                
                // Use the token with Supabase
                const { data: userData, error: userError } = await supabase.auth.getUser(token);
                
                if (userError) {
                  console.error("Error fetching Supabase user with Auth0 token:", userError);
                  toast({
                    title: "Authentication Error",
                    description: "There was an issue with your session. Please try logging in again.",
                    variant: "destructive",
                  });
                  await logout();
                  setIsLoading(false);
                  return;
                }
                
                if (userData.user) {
                  const userProfile = await fetchUserProfile(userData.user.id);
                  if (userProfile) {
                    setUser(userProfile);
                    await associateTempScriptsWithUser(userProfile);
                  } else {
                    // Create profile if not exists
                    const newUser: User = {
                      id: userData.user.id,
                      username: auth0User.name || auth0User.email?.split('@')[0] || 'user',
                      email: auth0User.email || 'unknown@email.com',
                      createdAt: new Date().toISOString()
                    };
                    
                    // Create user record in our users table
                    const { error: createError } = await supabase
                      .from('users')
                      .insert({
                        id: userData.user.id,
                        email: newUser.email,
                        username: newUser.username
                      });
                    
                    if (createError) {
                      console.error("Error creating user record:", createError);
                    } else {
                      setUser(newUser);
                      await associateTempScriptsWithUser(newUser);
                    }
                  }
                }
              }
            } catch (error) {
              console.error("Error processing Auth0 session:", error);
              toast({
                title: "Session Error",
                description: "There was an issue with your authentication session. Please log in again.",
                variant: "destructive",
              });
            }
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing Auth0:", error);
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
      // Handle redirect callback if applicable
      if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
        // Use handleRedirectCallback to process the login callback
        await auth0.handleRedirectCallback();
      }
      
      // Check if user is authenticated after callback processing
      const isAuthenticated = await auth0.isAuthenticated();
      
      if (isAuthenticated) {
        // Get user info from Auth0
        const auth0User = await auth0.getUser();
        
        if (auth0User && auth0User.sub) {
          try {
            // Get ID token for Supabase (this is different from the access token)
            const claims = await auth0.getIdTokenClaims();
            if (claims && claims.__raw) {
              const token = claims.__raw;
              
              // Update Supabase auth client with Auth0 token
              const { data, error } = await supabase.auth.getUser(token);
              
              if (error) {
                console.error("Error fetching Supabase user with Auth0 token:", error);
                throw error;
              }
              
              if (data.user) {
                const userProfile = await fetchUserProfile(data.user.id);
                if (userProfile) {
                  setUser(userProfile);
                  await associateTempScriptsWithUser(userProfile);
                } else {
                  // Create profile if not exists
                  const newUser: User = {
                    id: data.user.id,
                    username: auth0User.name || auth0User.email?.split('@')[0] || 'user',
                    email: auth0User.email || 'unknown@email.com',
                    createdAt: new Date().toISOString()
                  };
                  
                  // Create user record in our users table
                  const { error: createError } = await supabase
                    .from('users')
                    .insert({
                      id: data.user.id,
                      email: newUser.email,
                      username: newUser.username
                    });
                  
                  if (createError) {
                    console.error("Error creating user record:", createError);
                    throw createError;
                  } else {
                    setUser(newUser);
                    await associateTempScriptsWithUser(newUser);
                  }
                }
              }
            } else {
              throw new Error("Failed to get ID token from Auth0");
            }
          } catch (error) {
            console.error("Error processing Auth0 session:", error);
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error processing Auth0 callback:", error);
      throw error;
    }
  };

  const signInWithAuth0 = async (): Promise<void> => {
    try {
      setIsLoading(true);
      // Use loginWithRedirect with appropriate options
      await auth0.loginWithRedirect({
        authorizationParams: {
          redirect_uri: `${window.location.origin}/callback`,
          // Include additional parameters if needed
          scope: 'openid profile email',
        }
      });
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

  const logout = async (): Promise<void> => {
    try {
      // Logout from Supabase
      await supabase.auth.signOut();
      
      // Clear local Auth0 session
      await auth0.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
      
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
      signInWithAuth0,
      logout,
      processAuthCallback
    }}>
      {children}
    </AuthContext.Provider>
  );
};
