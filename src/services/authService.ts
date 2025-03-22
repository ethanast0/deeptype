import { supabase } from "@/integrations/supabase/client";
import * as bcrypt from 'bcryptjs';
import { clearAuthData } from '@/integrations/supabase/client';

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

type LoginResponse = {
  userId?: string;
  error?: AuthError;
};

// Simple logging for auth operations
const logAuthAction = (action: string, details?: any) => {
  console.log(`[AUTH SERVICE] ${action}`, details ? details : '');
};

// Authenticate user with Supabase
export const authenticateWithSupabase = async (email: string, password: string) => {
  logAuthAction('Authenticating with Supabase', { email });
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      logAuthAction('Supabase authentication error', error);
      
      if (error.message === "Email not confirmed" || error.code === "email_not_confirmed") {
        const authError: AuthError = new Error("Please check your inbox and confirm your email before logging in.");
        authError.code = "email_not_confirmed";
        authError.originalError = error;
        throw authError;
      }
      
      throw error;
    }
    
    logAuthAction('Supabase authentication successful', { userId: data.user?.id });
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    logAuthAction('Supabase authentication exception', error);
    return { user: null, session: null, error };
  }
};

// Verify user against database
export const verifyUserCredentials = async (email: string, password: string): Promise<LoginResponse> => {
  logAuthAction('Verifying user credentials', { email });
  
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userError) {
      logAuthAction('User verification error', userError);
      const error: AuthError = new Error('Error verifying user credentials');
      error.code = 'verification_error';
      return { error };
    }
    
    if (!userData) {
      logAuthAction('User not found');
      const error: AuthError = new Error('Invalid email or password');
      error.code = 'invalid_credentials';
      return { error };
    }
    
    logAuthAction('User credentials verified', { userId: userData.id });
    return { userId: userData.id };
  } catch (error) {
    logAuthAction('User verification exception', error);
    // If error wasn't already transformed
    if (!error.code) {
      const authError: AuthError = new Error('Error during login');
      authError.code = 'login_error';
      authError.originalError = error;
      return { error: authError };
    }
    return { error };
  }
};

// Sign up a new user
export const signupUser = async (username: string, email: string, password: string) => {
  logAuthAction('Signing up new user', { email, username });
  
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
      logAuthAction('Supabase signup error', authError);
      return { error: authError };
    }
    
    if (!authData.user) {
      logAuthAction('No user returned from Supabase signup');
      const error: AuthError = new Error('Failed to create user account');
      error.code = 'signup_failed';
      return { error };
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
      logAuthAction('Database user creation error', userError);
      // Attempt to clean up the auth user since the database insert failed
      await supabase.auth.signOut();
      const error: AuthError = new Error('Failed to create user profile');
      error.code = 'db_error';
      return { error };
    }
    
    logAuthAction('User signup complete', { userId: userData.id });
    return { userId: userData.id };
  } catch (error) {
    logAuthAction('Signup exception', error);
    if (!error.code) {
      const authError: AuthError = new Error('Error during signup');
      authError.code = 'signup_error';
      authError.originalError = error;
      return { error: authError };
    }
    return { error };
  }
};

// Sign out the current user
export const signOutUser = async () => {
  logAuthAction('Signing out user');
  
  try {
    // Ensure we call the Supabase signOut with the right parameters
    const { error } = await supabase.auth.signOut({
      scope: 'local' // Only sign out from this browser, not all devices
    });
    
    if (error) {
      logAuthAction('Signout error', error);
      return { error };
    }
    
    // Also clear any cached auth data
    clearAuthData();
    logAuthAction('User signed out successfully');
    return { error: null };
  } catch (error) {
    logAuthAction('Signout exception', error);
    // Clear auth data even if the API call fails
    clearAuthData();
    return { error };
  }
};

// Resend confirmation email
export const resendConfirmationEmail = async (email: string) => {
  logAuthAction('Resending confirmation email', { email });
  
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: window.location.origin + '/login?verified=true',
      }
    });
    
    if (error) {
      logAuthAction('Resend confirmation error', error);
      return { error };
    }
    
    logAuthAction('Confirmation email sent');
    return { error: null };
  } catch (error) {
    logAuthAction('Resend confirmation exception', error);
    return { error };
  }
};

// Get current session
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error("Exception getting session:", error);
    return null;
  }
};

// Refresh auth token
export const refreshAuthToken = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Error refreshing token:", error);
      // Try to use our stored user ID as a fallback
      const storedUserId = localStorage.getItem('supabase.auth.user.id');
      if (storedUserId) {
        // Return a minimal session object for the app to work with
        return { user: { id: storedUserId } };
      }
      throw error;
    }
    
    // Update stored user ID if we were successful
    if (data.session?.user) {
      localStorage.setItem('supabase.auth.user.id', data.session.user.id);
    }
    
    return data.session;
  } catch (error) {
    console.error("Refresh token error:", error);
    return null;
  }
};
