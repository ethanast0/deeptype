/**
 * A debug utility for auth-related operations
 * This helps trace the authentication flow and identify race conditions
 */

// Configuration
let DEBUG_ENABLED = true;

// Object to store debug info
const authDebugInfo = {
  sessionChecks: [] as any[],
  localStorage: [] as any[],
  events: [] as any[],
  errors: [] as any[],
  currentStorage: {} as Record<string, any>,
};

// Track important auth-related localStorage keys
const AUTH_KEYS = [
  'supabase.auth.token',
  'supabase.auth.expires_at',
  'supabase.auth.user.id',
  'backup:supabase.auth.token',
  'backup:supabase.auth.user.id',
  'supabase_auth_session_fallback',
  'supabase_auth_user_fallback',
  'user_profile'
];

// Timestamp format helper
const formatTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
};

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Only log in development mode
const isDevelopment = isBrowser && import.meta.env?.DEV === true;

/**
 * Log an authentication-related debug message
 */
export const authDebug = (message: string, data?: any) => {
  if (!isDevelopment) return;
  
  const timestamp = new Date().toISOString();
  console.log(`[AUTH DEBUG ${timestamp}]`, message, data || '');
};

/**
 * Log authentication errors
 */
export const logAuthError = (message: string, error: any) => {
  if (!isDevelopment) return;
  
  const timestamp = new Date().toISOString();
  console.error(`[AUTH ERROR ${timestamp}]`, message, error);
};

/**
 * Log session check results
 */
export const traceSessionCheck = (source: string, hasSession: boolean, userId?: string) => {
  if (!isDevelopment) return;
  
  authDebug(`Session check [${source}]: ${hasSession ? 'Session found' : 'No session'}`, { userId });
};

/**
 * Monitor localStorage operations related to authentication
 */
export const watchLocalStorage = () => {
  if (typeof window === 'undefined' || !DEBUG_ENABLED) return;
  
  // Update current storage snapshot
  const updateStorageSnapshot = () => {
    AUTH_KEYS.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          if (key.includes('token')) {
            authDebugInfo.currentStorage[key] = '[TOKEN HIDDEN]';
          } else {
            authDebugInfo.currentStorage[key] = value;
          }
        } else {
          delete authDebugInfo.currentStorage[key];
        }
      } catch (e) {
        // Ignore errors
      }
    });
  };
  
  // Initial snapshot
  updateStorageSnapshot();
  
  // Hook original methods to monitor changes
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;
  const originalClear = localStorage.clear;
  
  localStorage.setItem = function(key: string, value: string) {
    const result = originalSetItem.call(this, key, value);
    
    if (AUTH_KEYS.includes(key) || key.includes('supabase.auth')) {
      const timestamp = formatTime();
      authDebugInfo.localStorage.push({
        timestamp,
        operation: 'SET',
        key,
        valueType: typeof value
      });
      
      // Update snapshot
      updateStorageSnapshot();
      
      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[STORAGE SET] ${timestamp} - Setting ${key} - ${key.includes('token') ? '[TOKEN HIDDEN]' : 'value set'}`);
      }
    }
    
    return result;
  };
  
  localStorage.removeItem = function(key: string) {
    const result = originalRemoveItem.call(this, key);
    
    if (AUTH_KEYS.includes(key) || key.includes('supabase.auth')) {
      const timestamp = formatTime();
      authDebugInfo.localStorage.push({
        timestamp,
        operation: 'REMOVE',
        key
      });
      
      // Update snapshot
      updateStorageSnapshot();
      
      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[STORAGE REMOVE] ${timestamp} - Removing ${key}`);
      }
    }
    
    return result;
  };
  
  localStorage.clear = function() {
    const timestamp = formatTime();
    authDebugInfo.localStorage.push({
      timestamp,
      operation: 'CLEAR',
      affectedKeys: Object.keys(authDebugInfo.currentStorage)
    });
    
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[STORAGE CLEAR] ${timestamp} - Clearing all storage`);
    }
    
    const result = originalClear.call(this);
    
    // Update snapshot
    updateStorageSnapshot();
    
    return result;
  };
};

/**
 * Get a complete dump of the auth debug info
 */
export const getAuthDebugInfo = () => {
  // Update storage snapshot before returning
  if (typeof window !== 'undefined') {
    AUTH_KEYS.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          if (key.includes('token')) {
            authDebugInfo.currentStorage[key] = '[TOKEN HIDDEN]';
          } else {
            authDebugInfo.currentStorage[key] = value;
          }
        } else {
          delete authDebugInfo.currentStorage[key];
        }
      } catch (e) {
        // Ignore errors
      }
    });
  }
  
  return {
    timestamp: formatTime(),
    sessionChecks: authDebugInfo.sessionChecks,
    localStorage: authDebugInfo.localStorage,
    events: authDebugInfo.events,
    errors: authDebugInfo.errors,
    currentStorage: authDebugInfo.currentStorage
  };
};

/**
 * Enable or disable debug logging
 */
export const setAuthDebugEnabled = (enabled: boolean) => {
  DEBUG_ENABLED = enabled;
  console.log(`Auth debugging ${enabled ? 'enabled' : 'disabled'}`);
};

// Start localStorage watching if in browser
if (typeof window !== 'undefined') {
  watchLocalStorage();
}

// Export types for better intellisense
export type { }; 