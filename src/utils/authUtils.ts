
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAuth0Client } from "@/integrations/auth0/client";

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
    // Check if user already exists first
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (existingUser) {
      return {
        id: existingUser.id,
        username: existingUser.username || username,
        email: existingUser.email || email,
        createdAt: existingUser.created_at
      };
    }
    
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

// Use Auth0 session to authenticate with Supabase
export const signInToSupabaseWithAuth0 = async (): Promise<{user: SupabaseUser | null, error: any}> => {
  try {
    const auth0 = await getAuth0Client();
    
    // Get the ID token from Auth0
    const isAuthenticated = await auth0.isAuthenticated();
    if (!isAuthenticated) {
      return { user: null, error: new Error("Not authenticated with Auth0") };
    }
    
    const token = await auth0.getTokenSilently();
    
    // Sign in to Supabase with the custom token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'auth0',
      token,
    });
    
    if (error) {
      console.error("Supabase auth error:", error);
      return { user: null, error };
    }
    
    return { user: data?.user || null, error: null };
  } catch (error) {
    console.error("Error signing in to Supabase with Auth0:", error);
    return { user: null, error };
  }
};

// Process Auth0 authentication and link with Supabase
export const processAuth0User = async (): Promise<User | null> => {
  try {
    const auth0 = await getAuth0Client();
    
    // Verify the user is authenticated with Auth0
    const isAuthenticated = await auth0.isAuthenticated();
    if (!isAuthenticated) {
      return null;
    }
    
    // Get user info from Auth0
    const auth0User = await auth0.getUser();
    
    if (auth0User && auth0User.sub) {
      // First sign in to Supabase with the Auth0 token
      const { user: supabaseUser, error } = await signInToSupabaseWithAuth0();
      
      if (error || !supabaseUser) {
        console.error("Failed to authenticate with Supabase:", error);
        throw error;
      }
      
      // Try to fetch existing profile
      let userProfile = await fetchUserProfile(supabaseUser.id);
      
      if (!userProfile) {
        // Create profile if not exists
        const username = auth0User.name || auth0User.email?.split('@')[0] || 'user';
        const email = auth0User.email || 'unknown@email.com';
        
        userProfile = await createUserProfile(supabaseUser.id, username, email);
      }
      
      if (userProfile) {
        await associateTempScriptsWithUser(userProfile);
        return userProfile;
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
    const auth0 = await getAuth0Client();
    
    // Handle redirect callback if applicable
    if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
      try {
        await auth0.handleRedirectCallback();
      } catch (error) {
        console.error("Error handling Auth0 callback:", error);
        // Clear any potentially corrupt state
        localStorage.removeItem('auth0.state');
        throw error;
      }
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
    const auth0 = await getAuth0Client();
    
    // Clear any potentially stale state before starting a new login
    localStorage.removeItem('auth0.state');
    
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
    const auth0 = await getAuth0Client();
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
