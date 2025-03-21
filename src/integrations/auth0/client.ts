import { createAuth0Client, Auth0Client } from '@auth0/auth0-spa-js';

const auth0Domain = 'dev-thhqocp8jw018dpu.us.auth0.com'; 
const auth0ClientId = 'IJqUdbzKbG8vESWvA5ArQsyChCWmvYa5';

export const getAuth0Client = async (): Promise<Auth0Client> => {
  return createAuth0Client({
    domain: auth0Domain,
    clientId: auth0ClientId,
    authorizationParams: {
      redirect_uri: `${window.location.origin}/callback`,
    },
    cacheLocation: 'localstorage',
  });
};

export { auth0Domain, auth0ClientId };