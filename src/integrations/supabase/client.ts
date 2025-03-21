import { createClient } from '@supabase/supabase-js'
import Auth0Client from '@auth0/auth0-spa-js'

const auth0 = new Auth0Client({
  domain: 'dev-thhqocp8jw018dpu.us.auth0.com',
  clientId: '<IJqUdbzKbG8vESWvA5ArQsyChCWmvYa5',
  authorizationParams: {
    redirect_uri: 'https://monkeytype-smart.lovable.app/callback',
  },
})

const supabase = createClient('https://<supabase-project>.supabase.co', 'SUPABASE_ANON_KEY', {
  accessToken: async () => {
    const accessToken = await auth0.getTokenSilently()

    // Alternatively, you can use (await auth0.getIdTokenClaims()).__raw 
    // to use an ID token instead.

    return accessToken
  },
})