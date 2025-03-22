/**
 * A debug utility for auth-related operations
 * This helps trace the authentication flow and identify race conditions
 */

// Configuration
let DEBUG_ENABLED = true;

// Object to store debug info
const authDebugInfo = {
  sessionChecks: [] as any[],
  localStorage: {} as Record<string, any>,
  authEvents: [] as any[],
  errors: [] as any[],
};

// Timestamp format helper
const formatTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
};

/**
 * Log a message with timestamp and optional data object
 */
export const authDebug = (message: string, data?: any) => {
  if (!DEBUG_ENABLED) return;

  const logEntry = {
    time: formatTime(),
    message,
    data,
    stackTrace: new Error().stack?.split('\n').slice(2).join('\n')
  };
  
  // Always log to console for immediate feedback
  console.log(`[AUTH DEBUG] ${logEntry.time} - ${message}`, data || '');
  
  // Store in our debug info object
  authDebugInfo.authEvents.push(logEntry);
};

/**
 * Specifically trace session checks with their results
 */
export const traceSessionCheck = (source: string, result: any) => {
  if (!DEBUG_ENABLED) return;
  
  const entry = {
    time: formatTime(),
    source,
    hasSession: !!result?.user,
    userId: result?.user?.id,
    tokenExpiry: result?.expires_at ? new Date(result.expires_at * 1000).toISOString() : 'N/A',
    stackTrace: new Error().stack?.split('\n').slice(2).join('\n')
  };
  
  authDebugInfo.sessionChecks.push(entry);
  
  console.log(`[SESSION CHECK] ${entry.time} - ${source} - Has session: ${entry.hasSession}`, entry.userId ? `User ID: ${entry.userId}` : '');
};

/**
 * Monitor localStorage operations related to auth
 */
export const watchLocalStorage = () => {
  if (typeof window === 'undefined' || !DEBUG_ENABLED) return;
  
  const keysToWatch = [
    'supabase.auth.token',
    'supabase.auth.refreshToken',
    'supabase.auth.user.id',
    'backup:supabase.auth.user.id',
    'cached_user_profile',
    'supabase.auth.event'
  ];
  
  // Store initial state
  keysToWatch.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      authDebugInfo.localStorage[key] = value ? "present" : "absent";
    } catch (e) {
      authDebugInfo.localStorage[key] = "error reading";
    }
  });
  
  // Hook original methods to monitor changes
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;
  const originalClear = localStorage.clear;
  
  localStorage.setItem = function(key: string, value: string) {
    if (keysToWatch.includes(key)) {
      const stackTrace = new Error().stack;
      console.log(`[STORAGE SET] ${formatTime()} - Setting ${key}`, { 
        value: key.includes('token') ? "[[token data - hidden]]" : value,
        stackTrace: stackTrace?.split('\n').slice(2).join('\n')
      });
      authDebugInfo.localStorage[key] = "present";
    }
    return originalSetItem.call(this, key, value);
  };
  
  localStorage.removeItem = function(key: string) {
    if (keysToWatch.includes(key)) {
      const stackTrace = new Error().stack;
      console.log(`[STORAGE REMOVE] ${formatTime()} - Removing ${key}`, {
        stackTrace: stackTrace?.split('\n').slice(2).join('\n')
      });
      authDebugInfo.localStorage[key] = "removed";
    }
    return originalRemoveItem.call(this, key);
  };
  
  localStorage.clear = function() {
    const stackTrace = new Error().stack;
    console.log(`[STORAGE CLEAR] ${formatTime()} - Clearing all storage`, {
      stackTrace: stackTrace?.split('\n').slice(2).join('\n')
    });
    keysToWatch.forEach(key => {
      authDebugInfo.localStorage[key] = "cleared";
    });
    return originalClear.call(this);
  };
};

/**
 * Log auth related errors
 */
export const logAuthError = (source: string, error: any) => {
  if (!DEBUG_ENABLED) return;
  
  const entry = {
    time: formatTime(),
    source,
    error: error instanceof Error ? { 
      message: error.message, 
      name: error.name, 
      stack: error.stack 
    } : error,
    stackTrace: new Error().stack?.split('\n').slice(2).join('\n')
  };
  
  authDebugInfo.errors.push(entry);
  
  console.error(`[AUTH ERROR] ${entry.time} - ${source}:`, error);
};

/**
 * Get a complete dump of the auth debug info
 */
export const getAuthDebugInfo = () => {
  return {
    ...authDebugInfo,
    currentState: {
      timestamp: formatTime(),
      localStorage: Object.fromEntries(
        Object.keys(authDebugInfo.localStorage).map(key => [
          key, 
          key.includes('token') ? "[[token data - hidden]]" : localStorage.getItem(key) ? "present" : "absent"
        ])
      )
    }
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