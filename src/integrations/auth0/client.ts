
import { createAuth0Client, Auth0Client } from '@auth0/auth0-spa-js';

const auth0Domain = 'your-auth0-domain.auth0.com'; // Replace with your Auth0 domain
const auth0ClientId = 'your-auth0-client-id'; // Replace with your Auth0 client ID

export const getAuth0Client = async (): Promise<Auth0Client> => {
  return createAuth0Client({
    domain: auth0Domain,
    clientId: auth0ClientId,
    authorizationParams: {
      redirect_uri: window.location.origin,
    },
    cacheLocation: 'localstorage',
  });
};
