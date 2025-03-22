
import { initializeAuth, checkPersistedSession, refreshSession, supabase, clearAuthData, attemptSessionRecovery } from '@/integrations/supabase/client';

// Check for authentication errors that might block normal login
const checkForAuthErrors = () => {
  // Check URL parameters for error indicators
  const url = new URL(window.location.href);
  const reset = url.searchParams.get('reset');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  
  if (reset === 'true' || error) {
    console.log('Reset or error parameter detected, clearing auth state');
    clearAuthData();
    
    // If we had an actual auth error, log it
    if (error) {
      console.error('Auth error detected:', error, errorDescription);
    }
    
    // Remove the parameters
    url.searchParams.delete('reset');
    url.searchParams.delete('error');
    url.searchParams.delete('error_description');
    window.history.replaceState({}, document.title, url.toString());
  }
  
  // Check for potential localStorage corruption
  try {
    // Attempt to parse key auth-related items
    const authToken = localStorage.getItem('supabase.auth.token');
    if (authToken) {
      try {
        JSON.parse(authToken);
      } catch (e) {
        console.error('Corrupted auth token detected, clearing auth data');
        clearAuthData();
      }
    }
  } catch (e) {
    console.error('Error checking localStorage:', e);
  }
};

// Function to periodically refresh the token while the app is active
const setupTokenRefresh = () => {
  let refreshInterval: ReturnType<typeof setInterval> | null = null;
  
  const startRefreshInterval = () => {
    if (refreshInterval) clearInterval(refreshInterval);
    
    // Refresh token every 9 minutes (slightly less than the 10 min default expiry)
    refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('Performing periodic token refresh');
        refreshSession().catch(e => console.error('Error in periodic token refresh:', e));
      }
    }, 9 * 60 * 1000);
  };
  
  // Start the refresh interval
  startRefreshInterval();
  
  // Setup the visibility change listener
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('Document became visible, refreshing session immediately');
      refreshSession().catch(e => console.error('Error refreshing session on visibility change:', e));
      
      // Restart the interval to ensure timely refreshes
      startRefreshInterval();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Return cleanup function
  return () => {
    if (refreshInterval) clearInterval(refreshInterval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// This function initializes auth-related functionality
// It should be imported and called as early as possible in the app lifecycle
export const initializeAuthentication = async () => {
  console.log('Initializing authentication system...');
  
  if (typeof window !== 'undefined') {
    // Check for auth errors first before anything else
    checkForAuthErrors();
    
    // Initialize cross-tab auth handling
    const authHandler = initializeAuth();
    let tokenRefreshCleanup: (() => void) | null = null;
    
    try {
      // Pre-check for session to speed up hydration
      let session = await checkPersistedSession();
      
      if (!session) {
        console.log('No persistent session found, attempting recovery');
        const recoveryResult = await attemptSessionRecovery();
        session = recoveryResult.session;
      }
      
      if (session?.user?.id) {
        console.log('Auth init: Found valid session for user', session.user.id);
        
        // Store the user ID in both places for redundancy
        localStorage.setItem('supabase.auth.user.id', session.user.id);
        localStorage.setItem('backup:supabase.auth.user.id', session.user.id);
        
        // Refresh the token immediately if we have a session
        refreshSession().catch(e => console.error('Error refreshing initial session:', e));
        
        // Setup token refresh mechanism
        tokenRefreshCleanup = setupTokenRefresh();
      } else {
        console.log('Auth init: No valid session found');
        
        // Check for leftover IDs that might cause issues
        const storedUserId = localStorage.getItem('supabase.auth.user.id') || 
                            localStorage.getItem('backup:supabase.auth.user.id');
                            
        if (storedUserId) {
          console.log('Auth init: Found stored user ID but no session, clearing it');
          clearAuthData(); // Clean up orphaned data
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      
      // Even if initialization fails, try to recover from stored data
      const storedUserId = localStorage.getItem('supabase.auth.user.id') || 
                          localStorage.getItem('backup:supabase.auth.user.id');
                          
      if (storedUserId) {
        console.log('Attempting recovery from stored user ID after init error');
        
        // We'll keep the ID and let the auth context try to recover later
        // but we won't start refresh processes yet
      } else {
        // If no stored ID, clear any partial auth data
        clearAuthData();
      }
    }
    
    // Add window event listeners for online/offline status
    const handleOnline = () => {
      console.log('Device is back online, refreshing session');
      refreshSession().catch(e => console.error('Error refreshing session after coming online:', e));
    };
    
    window.addEventListener('online', handleOnline);
    
    // Error boundary for unhandled promise rejections related to auth
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      // Check if it's an auth-related error
      if (error && typeof error === 'object' && 
          ((error.message && error.message.toLowerCase().includes('auth')) || 
           (error.error_description && error.error_description.toLowerCase().includes('auth')))) {
        console.error('Unhandled auth-related rejection:', error);
        // Don't immediately clear auth data, let the recovery mechanisms try first
      }
    });
    
    return {
      cleanup: () => {
        if (authHandler && typeof authHandler.cleanup === 'function') {
          authHandler.cleanup();
        }
        if (tokenRefreshCleanup) {
          tokenRefreshCleanup();
        }
        window.removeEventListener('online', handleOnline);
      }
    };
  }
  
  return { cleanup: () => {} };
};

// Call this function immediately to initialize auth as soon as possible
// This helps with the initial session check before the components mount
let authCleanup: { cleanup: () => void } | null = null;

if (typeof window !== 'undefined') {
  // Use set timeout to ensure this happens after any potential error
  // in the main javascript thread but still very early
  setTimeout(() => {
    initializeAuthentication().then(cleanup => {
      authCleanup = cleanup;
    }).catch(e => {
      console.error('Failed to initialize authentication:', e);
    });
  }, 0);
}

// Add a listener for before unload to clean up
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (authCleanup) {
      authCleanup.cleanup();
    }
  });
}

export default initializeAuthentication;
