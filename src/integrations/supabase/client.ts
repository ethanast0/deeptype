
import { createClient } from '@supabase/supabase-js'
import { Auth0Client } from '@auth0/auth0-spa-js'

const auth0 = new Auth0Client({
  domain: 'dev-thhqocp8jw018dpu.us.auth0.com',
  clientId: 'IJqUdbzKbG8vESWvA5ArQsyChCWmvYa5',
  authorizationParams: {
    redirect_uri: `${window.location.origin}/callback`,
  },
})

// Use the proper Supabase URL format with the project ID
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

export { supabase, auth0 }
