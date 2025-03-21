
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with proper configuration
const supabaseUrl = 'https://mjvnjaxjilztaebmpxmy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdm5qYXhqaWx6dGFlYm1weG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MzU5MTAsImV4cCI6MjA1ODAxMTkxMH0.piNkqjJB7_7qwo0dYI2vUeeahKRZSpMuASceaeKnPTo'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  }
})

export { supabase }
