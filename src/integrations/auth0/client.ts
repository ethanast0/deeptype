
import { createAuth0Client, Auth0Client } from '@auth0/auth0-spa-js';

const auth0Domain = 'dev-thhqocp8jw018dpu.us.auth0.com'; // Replace with your Auth0 domain
const auth0ClientId = '2yUjFaMgLB5GQcwuMRv8xEP9c7QiTJ5F'; // Replace with your Auth0 client ID

export const getAuth0Client = async (): Promise<Auth0Client> => {
  return createAuth0Client({
    domain: 'dev-thhqocp8jw018dpu.us.auth0.com',
    clientId: '2yUjFaMgLB5GQcwuMRv8xEP9c7QiTJ5F',
    authorizationParams: {
      redirect_uri: `${window.location.origin}/callback`,  // ✅ Ensure "/callback" is included
    },
    cacheLocation: 'localstorage',
  });
};
