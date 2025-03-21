
import { createClient } from '@supabase/supabase-js'
import { createAuth0Client, Auth0Client } from '@auth0/auth0-spa-js'

// Auth0 configuration
const auth0Domain = 'dev-thhqocp8jw018dpu.us.auth0.com'; 
const auth0ClientId = 'IJqUdbzKbG8vESWvA5ArQsyChCWmvYa5';

// Create Auth0 client with consistent configuration
export const auth0 = new Auth0Client({
  domain: auth0Domain,
  clientId: auth0ClientId,
  authorizationParams: {
    redirect_uri: `${window.location.origin}/callback`,
  },
  cacheLocation: 'localstorage', // Use localstorage for better persistence
  useRefreshTokens: true, // Enable refresh tokens for longer sessions
});

// Create Supabase client with proper configuration
const supabaseUrl = 'https://mjvnjaxjilztaebmpxmy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdm5qYXhqaWx6dGFlYm1weG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MzU5MTAsImV4cCI6MjA1ODAxMTkxMH0.piNkqjJB7_7qwo0dYI2vUeeahKRZSpMuASceaeKnPTo'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: fetch.bind(globalThis)
  }
})

export { supabase, auth0Domain, auth0ClientId }
