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

// Direct auth with Supabase using email/password
export const directAuthWithSupabase = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { user: data?.user || null, error };
  } catch (error) {
    console.error("Error in direct auth:", error);
    return { user: null, error };
  }
};

// Process Auth0 authentication
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
    
    if (!auth0User || !auth0User.sub) {
      console.error("No valid Auth0 user found");
      return null;
    }
    
    // Now authenticate with Supabase directly using the Auth0 user email
    // This is a workaround since we can't use OIDC with Auth0 directly
    // In a production app, you'd set up a proper JWT integration between Auth0 and Supabase
    try {
      // Try to fetch an existing user with this email
      const email = auth0User.email || "";
      if (!email) {
        console.error("No email found in Auth0 user");
        return null;
      }
      
      // Generate a random password for Supabase auth (not exposed to user)
      // This is just a workaround for demonstration purposes
      const tempPassword = Math.random().toString(36).slice(-10);
      
      // First try signing in
      const { user: existingUser, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: tempPassword,
      });
      
      // If user doesn't exist, create one
      if (signInError && signInError.message.includes("Invalid login credentials")) {
        // Create the user in Supabase
        const { data: newUser, error: signUpError } = await supabase.auth.signUp({
          email,
          password: tempPassword,
        });
        
        if (signUpError) {
          console.error("Error creating user in Supabase:", signUpError);
          return null;
        }
        
        if (newUser.user) {
          // Create user profile with Auth0 data
          const username = auth0User.name || auth0User.email?.split('@')[0] || 'user';
          const userProfile = await createUserProfile(newUser.user.id, username, email);
          
          if (userProfile) {
            await associateTempScriptsWithUser(userProfile);
            return userProfile;
          }
        }
      } else if (existingUser) {
        // User exists, get their profile
        const userProfile = await fetchUserProfile(existingUser.id);
        
        if (userProfile) {
          await associateTempScriptsWithUser(userProfile);
          return userProfile;
        } else {
          // Create profile if somehow it doesn't exist
          const username = auth0User.name || auth0User.email?.split('@')[0] || 'user';
          const newProfile = await createUserProfile(existingUser.id, username, email);
          
          if (newProfile) {
            await associateTempScriptsWithUser(newProfile);
            return newProfile;
          }
        }
      }
    } catch (error) {
      console.error("Error authenticating with Supabase:", error);
      return null;
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
