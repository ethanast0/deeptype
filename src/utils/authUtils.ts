
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase, auth0 } from "@/integrations/supabase/client";

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
}

// Fetch user profile from Supabase
export const fetchUserProfile = async (id: string): Promise<User | null> => {
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

// Handle associating temporary scripts with a user
export const associateTempScriptsWithUser = async (user: User) => {
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

// Create user profile in Supabase if it doesn't exist
export const createUserProfile = async (userId: string, username: string, email: string): Promise<User | null> => {
  try {
    const newUser: User = {
      id: userId,
      username,
      email,
      createdAt: new Date().toISOString()
    };
    
    // Create user record in our users table
    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        username
      });
    
    if (error) {
      console.error("Error creating user record:", error);
      return null;
    }
    
    return newUser;
  } catch (error) {
    console.error("Error creating user profile:", error);
    return null;
  }
};

// Process Auth0 authentication and link with Supabase
export const processAuth0User = async (): Promise<User | null> => {
  try {
    // Get user info from Auth0
    const auth0User = await auth0.getUser();
    
    if (auth0User && auth0User.sub) {
      // Get ID token for Supabase
      const claims = await auth0.getIdTokenClaims();
      if (claims && claims.__raw) {
        const token = claims.__raw;
        
        // Use the token with Supabase
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        
        if (userError) {
          console.error("Error fetching Supabase user with Auth0 token:", userError);
          throw userError;
        }
        
        if (userData.user) {
          // Try to fetch existing profile
          const userProfile = await fetchUserProfile(userData.user.id);
          
          if (userProfile) {
            await associateTempScriptsWithUser(userProfile);
            return userProfile;
          } else {
            // Create profile if not exists
            const username = auth0User.name || auth0User.email?.split('@')[0] || 'user';
            const email = auth0User.email || 'unknown@email.com';
            
            const newUser = await createUserProfile(userData.user.id, username, email);
            
            if (newUser) {
              await associateTempScriptsWithUser(newUser);
              return newUser;
            }
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error processing Auth0 user:", error);
    throw error;
  }
};

// Handle Auth0 callback
export const handleAuth0Callback = async (): Promise<User | null> => {
  try {
    // Handle redirect callback if applicable
    if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
      await auth0.handleRedirectCallback();
    }
    
    // Check if user is authenticated after callback processing
    const isAuthenticated = await auth0.isAuthenticated();
    
    if (isAuthenticated) {
      return await processAuth0User();
    }
    
    return null;
  } catch (error) {
    console.error("Error handling Auth0 callback:", error);
    throw error;
  }
};

// Initiate Auth0 sign in
export const signInWithAuth0 = async (): Promise<void> => {
  try {
    // Use loginWithRedirect with appropriate options
    await auth0.loginWithRedirect({
      authorizationParams: {
        redirect_uri: `${window.location.origin}/callback`,
        scope: 'openid profile email',
      }
    });
  } catch (error) {
    console.error("Auth0 sign-in error:", error);
    throw error;
  }
};

// Logout from both Auth0 and Supabase
export const logoutFromAuth = async (): Promise<void> => {
  try {
    // Logout from Supabase
    await supabase.auth.signOut();
    
    // Clear local Auth0 session
    await auth0.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
};
