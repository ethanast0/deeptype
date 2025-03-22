user action: loggin with https://monkeytype-smart.lovable.app/login
console:
Initializing authentication system...
index-CR3C2daT.js:22 Initializing auth connections...
index-CR3C2daT.js:225 Login effect triggered, user state: false
index-CR3C2daT.js:177 Initializing auth state...
index-CR3C2daT.js:177 Checking for existing session...
index-CR3C2daT.js:22 Auth init: No valid session found
index-CR3C2daT.js:177 Auth state changed: INITIAL_SESSION undefined
index-CR3C2daT.js:177 No existing session found

user action: logged with email and password
system logs in the profile
console:
index-CR3C2daT.js:22 Initializing authentication system...
index-CR3C2daT.js:22 Initializing auth connections...
index-CR3C2daT.js:225 Login effect triggered, user state: false
index-CR3C2daT.js:177 Initializing auth state...
index-CR3C2daT.js:177 Checking for existing session...
index-CR3C2daT.js:22 Auth init: No valid session found
index-CR3C2daT.js:177 Auth state changed: INITIAL_SESSION undefined
index-CR3C2daT.js:177 No existing session found
index-CR3C2daT.js:225 Attempting login with email: baratpaim+106@gmail.com
index-CR3C2daT.js:177 Login attempt for: baratpaim+106@gmail.com
index-CR3C2daT.js:177 Auth state changed: SIGNED_IN 788235f7-77bf-4a2c-87e9-080f77b5d165
index-CR3C2daT.js:177 User SIGNED_IN event, updating user state
index-CR3C2daT.js:177 Auth state change, user ID: 788235f7-77bf-4a2c-87e9-080f77b5d165
index-CR3C2daT.js:177 Fetching user profile for ID: 788235f7-77bf-4a2c-87e9-080f77b5d165
index-CR3C2daT.js:173 Fetching user profile for ID: 788235f7-77bf-4a2c-87e9-080f77b5d165
index-CR3C2daT.js:173 User profile found: {id: '788235f7-77bf-4a2c-87e9-080f77b5d165', username: 'paim106', email: 'baratpaim+106@gmail.com', createdAt: '2025-03-21T23:40:39.578994'}
index-CR3C2daT.js:177 Setting user profile: {id: '788235f7-77bf-4a2c-87e9-080f77b5d165', username: 'paim106', email: 'baratpaim+106@gmail.com', createdAt: '2025-03-21T23:40:39.578994'}
index-CR3C2daT.js:225 Login effect triggered, user state: true
index-CR3C2daT.js:225 User authenticated, navigating to home
index-CR3C2daT.js:177 Auth already initialized, skipping

user action: press refresh
system logs out the profile
console:
Initializing authentication system...
index-CR3C2daT.js:22 Initializing auth connections...
index-CR3C2daT.js:177 Initializing auth state...
index-CR3C2daT.js:177 Checking for existing session...
index-CR3C2daT.js:177 Auth state changed: SIGNED_IN 788235f7-77bf-4a2c-87e9-080f77b5d165
index-CR3C2daT.js:177 User SIGNED_IN event, updating user state
index-CR3C2daT.js:177 Auth state change, user ID: 788235f7-77bf-4a2c-87e9-080f77b5d165
index-CR3C2daT.js:177 Fetching user profile for ID: 788235f7-77bf-4a2c-87e9-080f77b5d165
index-CR3C2daT.js:173 Fetching user profile for ID: 788235f7-77bf-4a2c-87e9-080f77b5d165

user action: trying to login again
system does not allow login
console:
index-CR3C2daT.js:225 Login effect triggered, user state: false