
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAuth0Client } from "@/integrations/auth0/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Auth0Client } from "@auth0/auth0-spa-js";

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
  const [auth0Client, setAuth0Client] = useState<Auth0Client | null>(null);
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

  // Initialize Auth0 client
  useEffect(() => {
    const initAuth0 = async () => {
      try {
        const client = await getAuth0Client();
        setAuth0Client(client);
        
        // Handle redirect callback if applicable
        if (window.location.search.includes("code=")) {
          await client.handleRedirectCallback();
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // Check if user is authenticated with Auth0
        const isAuthenticated = await client.isAuthenticated();
        
        if (isAuthenticated) {
          const auth0User = await client.getUser();
          if (auth0User) {
            // Get token for Supabase
            const token = await client.getTokenSilently();
            
            // Update Supabase auth client with Auth0 token
            const { data, error } = await supabase.auth.getUser(token);
            
            if (error) {
              console.error("Error fetching Supabase user with Auth0 token:", error);
              setIsLoading(false);
              return;
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
                } else {
                  setUser(newUser);
                  await associateTempScriptsWithUser(newUser);
                }
              }
            }
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing Auth0:", error);
        setIsLoading(false);
      }
    };
    
    initAuth0();
  }, []);

  // Listen for auth changes in Supabase
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

  const signInWithAuth0 = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      if (!auth0Client) {
        throw new Error("Auth0 client not initialized");
      }
      
      await auth0Client.loginWithRedirect();
      
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
      
      // Logout from Auth0
      if (auth0Client) {
        await auth0Client.logout({
          logoutParams: {
            returnTo: window.location.origin
          }
        });
      }
      
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
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
