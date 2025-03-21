import { supabase } from "@/integrations/supabase/client";
import * as bcrypt from 'bcryptjs';

export interface UserCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends UserCredentials {
  username: string;
}

export interface AuthError extends Error {
  code?: string;
  originalError?: any;
}

// Authenticate user with Supabase
export const authenticateWithSupabase = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Supabase auth error:", error);
      
      if (error.message === "Email not confirmed" || error.code === "email_not_confirmed") {
        const authError: AuthError = new Error("Please check your inbox and confirm your email before logging in.");
        authError.code = "email_not_confirmed";
        authError.originalError = error;
        throw authError;
      }
      
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
};

// Verify user against database
export const verifyUserCredentials = async (email: string, password: string) => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, email, password_hash, created_at')
      .eq('email', email)
      .maybeSingle();
    
    if (userError) {
      console.error("User verification error:", userError);
      throw new Error("Invalid email or password");
    }
    
    if (!userData) {
      throw new Error("Invalid email or password");
    }
    
    return userData;
  } catch (error) {
    console.error("Verification error:", error);
    throw error;
  }
};

// Sign up a new user
export const signupUser = async (username: string, email: string, password: string) => {
  try {
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/login?verified=true',
        data: {
          username
        }
      }
    });
    
    if (authError) {
      console.error("Auth signup error:", authError);
      throw authError;
    }
    
    if (!authData.user) {
      throw new Error("Failed to create user");
    }
    
    // Create user profile in our table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        username,
        password_hash: passwordHash
      })
      .select()
      .single();
    
    if (userError) {
      console.error("Error creating user record:", userError);
      throw userError;
    }
    
    return { authData, userData };
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
};

// Sign out the current user
export const signOutUser = async () => {
  try {
    // Clear any local storage items that might be related to auth
    localStorage.removeItem('supabase.auth.user.id');
    
    const { error } = await supabase.auth.signOut({
      scope: 'local' // Only sign out from this browser, not all devices
    });
    
    if (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

// Resend confirmation email
export const resendConfirmationEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: window.location.origin + '/login?verified=true',
      }
    });
    
    if (error) {
      console.error("Error resending confirmation email:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error resending confirmation email:", error);
    throw error;
  }
};

// Get current session
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error);
      throw error;
    }
    return data.session;
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
};

// Refresh auth token
export const refreshAuthToken = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
    return data.session;
  } catch (error) {
    console.error("Refresh token error:", error);
    return null;
  }
};
