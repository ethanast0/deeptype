import { initializeAuth, checkPersistedSession, refreshSession, supabase } from '@/integrations/supabase/client';

// Check for authentication errors that might block normal login
const checkForAuthErrors = () => {
  // Check URL parameters for error indicators
  const url = new URL(window.location.href);
  const reset = url.searchParams.get('reset');
  
  if (reset === 'true') {
    console.log('Reset parameter detected, clearing auth state');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refreshToken');
    localStorage.removeItem('supabase.auth.user.id');
    localStorage.removeItem('cached_user_profile');
    localStorage.removeItem('supabase.auth.event');
    
    // Remove the reset parameter
    url.searchParams.delete('reset');
    window.history.replaceState({}, document.title, url.toString());
  }
};

// This function initializes auth-related functionality
// It should be imported and called as early as possible in the app lifecycle
export const initializeAuthentication = async () => {
  console.log('Initializing authentication system...');
  
  if (typeof window !== 'undefined') {
    // Check for auth errors first
    checkForAuthErrors();
    
    // Initialize cross-tab auth handling
    const authHandler = initializeAuth();
    
    try {
      // Pre-check for session to speed up hydration
      const session = await checkPersistedSession();
      
      if (session?.user) {
        console.log('Auth init: Found valid session for user', session.user.id);
        
        // Refresh the token immediately if we have a session
        refreshSession().catch(e => console.error('Error refreshing initial session:', e));
        
        // Add event listeners for visibility changes
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            console.log('Document became visible, refreshing session');
            refreshSession().catch(e => console.error('Error refreshing session on visibility change:', e));
          }
        });
      } else {
        console.log('Auth init: No valid session found');
        
        // Check for leftover IDs that might cause issues
        const storedUserId = localStorage.getItem('supabase.auth.user.id');
        if (storedUserId && !session) {
          console.log('Auth init: Found orphaned user ID, checking session status');
          // Double-check with Supabase
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            console.log('Auth init: No valid session exists, clearing stored user ID');
            localStorage.removeItem('supabase.auth.user.id');
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
    
    return {
      cleanup: () => {
        if (authHandler?.cleanup) {
          authHandler.cleanup();
        }
      }
    };
  }
  
  return { cleanup: () => {} };
};

// Call this function immediately to initialize auth as soon as possible
// This helps with the initial session check before the components mount
if (typeof window !== 'undefined') {
  initializeAuthentication();
}

export default initializeAuthentication; 