user action: open the home page
system opens
console:
Initializing authentication system...
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.703 - [1] Initializing authentication 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.704 - [2] Checking for persisted session 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.704 - [3] Checking for persisted session 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.714 - Login component checking for existing session 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.714 - Login redirect effect triggered Object
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Initializing auth state... 
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Checking for existing session... 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.715 - [4] Checking for persisted session 
index-Ddkkp6HQ.js:26 [SESSION CHECK] 20:57:37.735 - checkPersistedSession-2 - Has session: false 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.735 - [2] No persisted session found, checking redundant storage 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.735 - [9] Attempting session recovery (attempt 1/3) 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.735 - [10] No redundant auth data found in storage 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.735 - [9] No stored auth data found for recovery 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.735 - [1] Auth initialization complete Object
index-Ddkkp6HQ.js:26 [SESSION CHECK] 20:57:37.735 - checkPersistedSession-3 - Has session: false 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.735 - [3] No persisted session found, checking redundant storage 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.735 - [12] Attempting session recovery (attempt 2/3) 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.735 - [13] No redundant auth data found in storage 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.735 - [12] No stored auth data found for recovery 
index-Ddkkp6HQ.js:34 Auth init: No valid session found
index-Ddkkp6HQ.js:26 [SESSION CHECK] 20:57:37.735 - Login-checkExistingSession - Has session: false 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.735 - Login component did not find active session 
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Auth state changed: INITIAL_SESSION 
index-Ddkkp6HQ.js:26 [SESSION CHECK] 20:57:37.737 - checkPersistedSession-4 - Has session: false 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.737 - [4] No persisted session found, checking redundant storage 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.737 - [17] Attempting session recovery (attempt 3/3) 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.737 - [18] No redundant auth data found in storage 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.737 - [17] No stored auth data found for recovery 
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] No existing session found 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:37.737 - [1] Auth state changed: INITIAL_SESSION Object
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:38.715 - Login component running delayed session check 
index-Ddkkp6HQ.js:26 [SESSION CHECK] 20:57:38.716 - Login-delayedCheck - Has session: false 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:57:38.716 - Delayed check state comparison Object
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:58:24.359 - [1] Document became visible, refreshing session 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:58:24.360 - [21] Attempting to refresh session 
index-Ddkkp6HQ.js:34 [AUTH ERROR] 20:58:24.361 - [21] Error refreshing session: AuthSessionMissingError: Auth session missing!
    at index-Ddkkp6HQ.js:22:53893
    at zb._useSession (index-Ddkkp6HQ.js:22:49620)
    at async zb._refreshSession (index-Ddkkp6HQ.js:22:53729)
    at async index-Ddkkp6HQ.js:22:53662
Ee @ index-Ddkkp6HQ.js:34
nn @ index-Ddkkp6HQ.js:34
await in nn
(anonymous) @ index-Ddkkp6HQ.js:34Understand this errorAI
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Window focused, checking session state 
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Performing explicit session check 
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Performing explicit session check 

## User action: Login with email and password
system logs the user in
console:
[AUTH CONTEXT] Performing explicit session check 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:59:19.467 - Attempting login with email {email: 'baratpaim+106@gmail.com', alreadyLoggedInState: false, userContextState: false}
index-Ddkkp6HQ.js:26 [SESSION CHECK] 20:59:19.469 - login-precheck - Has session: false 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:59:19.469 - [32] Clearing all auth data from storage 
index-Ddkkp6HQ.js:28 [STORAGE REMOVE] 20:59:19.470 - Removing supabase.auth.token {stackTrace: '    at fr (https://monkeytype-smart.lovable.app/as…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12855)'}
index-Ddkkp6HQ.js:28 [STORAGE REMOVE] 20:59:19.470 - Removing supabase.auth.user.id {stackTrace: '    at fr (https://monkeytype-smart.lovable.app/as…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12855)'}
index-Ddkkp6HQ.js:28 [STORAGE REMOVE] 20:59:19.470 - Removing backup:supabase.auth.user.id {stackTrace: '    at fr (https://monkeytype-smart.lovable.app/as…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12855)'}
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Login attempt for: baratpaim+106@gmail.com
index-Ddkkp6HQ.js:194 [AUTH SERVICE] Verifying user credentials {email: 'baratpaim+106@gmail.com'}
index-Ddkkp6HQ.js:194 [AUTH SERVICE] User credentials verified {userId: '788235f7-77bf-4a2c-87e9-080f77b5d165'}
index-Ddkkp6HQ.js:194 [AUTH SERVICE] Authenticating with Supabase {email: 'baratpaim+106@gmail.com'}
index-Ddkkp6HQ.js:28 [STORAGE REMOVE] 20:59:19.714 - Removing supabase.auth.user.id {stackTrace: '    at DP (https://monkeytype-smart.lovable.app/as…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12860)'}
index-Ddkkp6HQ.js:26 [STORAGE SET] 20:59:19.963 - Setting supabase.auth.token {value: '[[token data - hidden]]', stackTrace: '    at Object.setItem (https://monkeytype-smart.lo…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12860)'}
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:59:19.963 - [35] Stored auth item with backup: supabase.auth.token 
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Auth state changed: SIGNED_IN 788235f7-77bf-4a2c-87e9-080f77b5d165
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] User SIGNED_IN event, updating user state 
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Auth state change {userId: '788235f7-77bf-4a2c-87e9-080f77b5d165'}
index-Ddkkp6HQ.js:26 [STORAGE SET] 20:59:19.963 - Setting supabase.auth.user.id {value: '788235f7-77bf-4a2c-87e9-080f77b5d165', stackTrace: '    at https://monkeytype-smart.lovable.app/assets…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12860)'}
index-Ddkkp6HQ.js:26 [STORAGE SET] 20:59:19.964 - Setting backup:supabase.auth.user.id {value: '788235f7-77bf-4a2c-87e9-080f77b5d165', stackTrace: '    at https://monkeytype-smart.lovable.app/assets…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12860)'}
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Fetching user profile for ID: 788235f7-77bf-4a2c-87e9-080f77b5d165
index-Ddkkp6HQ.js:190 Fetching user profile for ID: 788235f7-77bf-4a2c-87e9-080f77b5d165
index-Ddkkp6HQ.js:190 No cached user profile found
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:59:19.964 - [1] Auth state changed: SIGNED_IN {hasSession: true, userId: '788235f7-77bf-4a2c-87e9-080f77b5d165', event: 'SIGNED_IN'}
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:59:19.965 - [36] Storing redundant auth data {userId: '788235f7-77bf-4a2c-87e9-080f77b5d165', expiresAt: '2025-03-22T01:59:19.000Z'}
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:59:19.965 - [37] Backed up auth item: supabase.auth.token 
index-Ddkkp6HQ.js:190 User profile found from database: {id: '788235f7-77bf-4a2c-87e9-080f77b5d165', username: 'paim106', email: 'baratpaim+106@gmail.com', createdAt: '2025-03-21T23:40:39.578994'}
index-Ddkkp6HQ.js:190 Caching user profile: {id: '788235f7-77bf-4a2c-87e9-080f77b5d165', username: 'paim106', email: 'baratpaim+106@gmail.com', createdAt: '2025-03-21T23:40:39.578994'}
index-Ddkkp6HQ.js:26 [STORAGE SET] 20:59:20.107 - Setting cached_user_profile {value: '{"id":"788235f7-77bf-4a2c-87e9-080f77b5d165","user…il.com","createdAt":"2025-03-21T23:40:39.578994"}', stackTrace: '    at wd (https://monkeytype-smart.lovable.app/as…t.lovable.app/assets/index-Ddkkp6HQ.js:194:21581)'}
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Setting user profile: {id: '788235f7-77bf-4a2c-87e9-080f77b5d165', username: 'paim106', email: 'baratpaim+106@gmail.com', createdAt: '2025-03-21T23:40:39.578994'}
index-Ddkkp6HQ.js:26 [STORAGE SET] 20:59:20.107 - Setting cached_user_profile {value: '{"id":"788235f7-77bf-4a2c-87e9-080f77b5d165","user…il.com","createdAt":"2025-03-21T23:40:39.578994"}', stackTrace: '    at https://monkeytype-smart.lovable.app/assets…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12860)'}
index-Ddkkp6HQ.js:26 [STORAGE SET] 20:59:20.108 - Setting supabase.auth.user.id {value: '788235f7-77bf-4a2c-87e9-080f77b5d165', stackTrace: '    at https://monkeytype-smart.lovable.app/assets…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12860)'}
index-Ddkkp6HQ.js:26 [STORAGE SET] 20:59:20.108 - Setting backup:supabase.auth.user.id {value: '788235f7-77bf-4a2c-87e9-080f77b5d165', stackTrace: '    at https://monkeytype-smart.lovable.app/assets…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12860)'}
index-Ddkkp6HQ.js:26 [STORAGE SET] 20:59:20.108 - Setting supabase.auth.token {value: '[[token data - hidden]]', stackTrace: '    at DP (https://monkeytype-smart.lovable.app/as…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12860)'}
index-Ddkkp6HQ.js:26 [STORAGE SET] 20:59:20.108 - Setting supabase.auth.user.id {value: '788235f7-77bf-4a2c-87e9-080f77b5d165', stackTrace: '    at DP (https://monkeytype-smart.lovable.app/as…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12860)'}
index-Ddkkp6HQ.js:194 [AUTH SERVICE] Supabase authentication successful {userId: '788235f7-77bf-4a2c-87e9-080f77b5d165'}
index-Ddkkp6HQ.js:26 [STORAGE SET] 20:59:20.108 - Setting cached_user_profile {value: '{"id":"788235f7-77bf-4a2c-87e9-080f77b5d165","user…il.com","createdAt":"2025-03-21T23:40:39.578994"}', stackTrace: '    at login (https://monkeytype-smart.lovable.app…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12860)'}
index-Ddkkp6HQ.js:26 [STORAGE SET] 20:59:20.108 - Setting supabase.auth.user.id {value: '788235f7-77bf-4a2c-87e9-080f77b5d165', stackTrace: '    at login (https://monkeytype-smart.lovable.app…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12860)'}
index-Ddkkp6HQ.js:26 [STORAGE SET] 20:59:20.108 - Setting backup:supabase.auth.user.id {value: '788235f7-77bf-4a2c-87e9-080f77b5d165', stackTrace: '    at login (https://monkeytype-smart.lovable.app…t.lovable.app/assets/index-Ddkkp6HQ.js:242:12860)'}
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:59:20.108 - Login function completed successfully 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:59:20.115 - Login redirect effect triggered {userState: true, alreadyLoggedIn: false, timeSinceMount: 102404}
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:59:20.115 - User authenticated in context, navigating to home {userId: '788235f7-77bf-4a2c-87e9-080f77b5d165', redirectTo: '/'}
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Auth already initialized, skipping 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:59:20.126 - Login component unmounted 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:59:20.143 - [38] Backed up auth item: supabase.auth.token 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 20:59:32.903 - [39] Backed up auth item: supabase.auth.token 

## User Action: User Refreshes and this time user does not log out

## User Action: User Refreshes again out of disbelief and this time it logs out
console:
Initializing authentication system...
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.223 - [1] Initializing authentication 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.223 - [2] Checking for persisted session 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.223 - [3] Checking for persisted session 
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Initializing auth state... 
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Checking for existing session... 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.233 - [4] Checking for persisted session 
index-Ddkkp6HQ.js:26 [SESSION CHECK] 21:00:27.245 - checkPersistedSession-2 - Has session: false 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.245 - [2] No persisted session found, checking redundant storage 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.245 - [9] Attempting session recovery (attempt 1/3) 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.245 - [10] No redundant auth data found in storage 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.245 - [9] No stored auth data found for recovery 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.245 - [1] Auth initialization complete {foundPersistedSession: false}
index-Ddkkp6HQ.js:26 [SESSION CHECK] 21:00:27.248 - checkPersistedSession-3 - Has session: false 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.248 - [3] No persisted session found, checking redundant storage 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.248 - [12] Attempting session recovery (attempt 2/3) 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.248 - [13] No redundant auth data found in storage 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.248 - [12] No stored auth data found for recovery 
index-Ddkkp6HQ.js:34 Auth init: No valid session found
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] Auth state changed: INITIAL_SESSION 
index-Ddkkp6HQ.js:26 [SESSION CHECK] 21:00:27.249 - checkPersistedSession-4 - Has session: false 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.249 - [4] No persisted session found, checking redundant storage 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.249 - [16] Attempting session recovery (attempt 3/3) 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.249 - [17] No redundant auth data found in storage 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.249 - [16] No stored auth data found for recovery 
index-Ddkkp6HQ.js:194 [AUTH CONTEXT] No existing session found 
index-Ddkkp6HQ.js:24 [AUTH DEBUG] 21:00:27.249 - [1] Auth state changed: INITIAL_SESSION {hasSession: false, userId: undefined, event: 'INITIAL_SESSION'}