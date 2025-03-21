import { initializeAuth, checkPersistedSession } from '@/integrations/supabase/client';

// This function initializes auth-related functionality
// It should be imported and called as early as possible in the app lifecycle
export const initializeAuthentication = async () => {
  console.log('Initializing authentication system...');
  
  // Initialize cross-tab auth handling
  const authHandler = initializeAuth();
  
  // Pre-check for session to speed up hydration
  await checkPersistedSession();
  
  return {
    cleanup: () => {
      if (authHandler?.cleanup) {
        authHandler.cleanup();
      }
    }
  };
};

// Call this function immediately to initialize auth as soon as possible
// This helps with the initial session check before the components mount
if (typeof window !== 'undefined') {
  initializeAuthentication();
}

export default initializeAuthentication; 