
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
};

// Verify user against database
export const verifyUserCredentials = async (email: string, password: string) => {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, username, email, password_hash, created_at')
    .eq('email', email)
    .single();
  
  if (userError || !userData) {
    console.error("User verification error:", userError);
    throw new Error("Invalid email or password");
  }
  
  const passwordMatch = await bcrypt.compare(password, userData.password_hash || '');
  
  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }
  
  return userData;
};

// Sign up a new user
export const signupUser = async (username: string, email: string, password: string) => {
  // Hash the password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  // Create auth user in Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
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
};

// Sign out the current user
export const signOutUser = async () => {
  await supabase.auth.signOut();
};

// Resend confirmation email
export const resendConfirmationEmail = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  
  if (error) {
    console.error("Error resending confirmation email:", error);
    throw error;
  }
};

// Get current session
export const getCurrentSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};
