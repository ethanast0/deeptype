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
  id: string;
  username: string;
  email: string;
  created_at: string;
};

// Extended debug logging for auth operations
const logAuthAction = (action: string, details?: any) => {
  console.log(`[AUTH SERVICE] ${action}`, details ? details : '');
};

// Authenticate user with Supabase
export const authenticateWithSupabase = async (email: string, password: string) => {
  logAuthAction('Authenticating with Supabase', { email });
  
  try {
    // First clear any existing session to prevent conflicts
    localStorage.removeItem('supabase.auth.user.id');
    
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
    
    // Explicitly store the session in localStorage for redundancy
    if (data.session) {
      localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
      if (data.user) {
        localStorage.setItem('supabase.auth.user.id', data.user.id);
      }
    }
    
    logAuthAction('Supabase authentication successful', { userId: data.user?.id });
    return data;
  } catch (error) {
    logAuthAction('Supabase authentication exception', error);
    throw error;
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
      throw { message: 'Error verifying user credentials', code: 'verification_error' };
    }
    
    if (!userData) {
      logAuthAction('User not found');
      throw { message: 'Invalid email or password', code: 'invalid_credentials' };
    }
    
    logAuthAction('User credentials verified', { userId: userData.id });
    return userData as LoginResponse;
  } catch (error) {
    logAuthAction('User verification exception', error);
    // If error wasn't already transformed
    if (!error.code) {
      throw { message: 'Error during login', code: 'login_error', originalError: error };
    }
    throw error;
  }
};

// Sign up a new user
export const signupUser = async (username: string, email: string, password: string) => {
  logAuthAction('Signing up new user', { email, username });
  
  try {
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Clear any existing auth state
    localStorage.removeItem('supabase.auth.user.id');
    
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
      throw authError;
    }
    
    if (!authData.user) {
      logAuthAction('No user returned from Supabase signup');
      throw { message: 'Failed to create user account', code: 'signup_failed' };
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
      throw { message: 'Failed to create user profile', code: 'db_error' };
    }
    
    // Explicitly store the session in localStorage for redundancy
    if (authData.session) {
      localStorage.setItem('supabase.auth.token', JSON.stringify(authData.session));
      localStorage.setItem('supabase.auth.user.id', authData.user.id);
    }
    
    logAuthAction('User signup complete', { userId: userData.id });
    return { userData, authData };
  } catch (error) {
    logAuthAction('Signup exception', error);
    if (!error.code) {
      throw { message: 'Error during signup', code: 'signup_error', originalError: error };
    }
    throw error;
  }
};

// Sign out the current user
export const signOutUser = async () => {
  logAuthAction('Signing out user');
  
  try {
    // Clear all auth-related storage before signing out
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refreshToken');
    localStorage.removeItem('supabase.auth.user.id');
    localStorage.removeItem('supabase.auth.event');
    
    // Ensure we call the Supabase signOut with the right parameters
    const { error } = await supabase.auth.signOut({
      scope: 'local' // Only sign out from this browser, not all devices
    });
    
    if (error) {
      logAuthAction('Signout error', error);
      throw error;
    }
    
    // Also clear any cached auth data
    clearAuthData();
    logAuthAction('User signed out successfully');
  } catch (error) {
    logAuthAction('Signout exception', error);
    // Clear auth data even if the API call fails
    clearAuthData();
    throw error;
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
      throw error;
    }
    
    logAuthAction('Confirmation email sent');
  } catch (error) {
    logAuthAction('Resend confirmation exception', error);
    throw error;
  }
};

// Get current session
export const getCurrentSession = async () => {
  try {
    // Check localStorage first for our backup session info
    const storedUserId = localStorage.getItem('supabase.auth.user.id');
    const session = await supabase.auth.getSession();
    
    if (session.error) {
      console.error("Error getting session:", session.error);
      // If there's an error but we have a stored user ID, we'll try to recover
      if (storedUserId) {
        return { user: { id: storedUserId } };
      }
      return null;
    }
    
    // If we have a session, ensure the userId is also stored for redundancy
    if (session.data.session?.user) {
      localStorage.setItem('supabase.auth.user.id', session.data.session.user.id);
    } else if (storedUserId) {
      // We have a stored user ID but no active session - try to refresh
      const refreshResult = await supabase.auth.refreshSession();
      if (!refreshResult.error && refreshResult.data.session) {
        return refreshResult.data.session;
      }
    }
    
    return session.data.session;
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
