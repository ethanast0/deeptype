
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { refreshSession } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * A wrapper component that protects routes requiring authentication
 * Redirects unauthenticated users to the login page
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Validate session on mount and when user or isLoading changes
  useEffect(() => {
    const validateSession = async () => {
      try {
        // If we already have a user, they're authenticated
        if (user) {
          setIsAuthenticated(true);
          setIsValidating(false);
          return;
        }

        // If auth context is still loading, wait for it
        if (isLoading) {
          return;
        }

        // No user in context, try to refresh the session
        const result = await refreshSession();
        // Check if the result contains a session with a user
        setIsAuthenticated(!!result.success && !!result.session?.user);
      } catch (error) {
        console.error('Error validating authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();
  }, [user, isLoading]);

  // Show nothing while we're checking authentication
  if (isLoading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-monkey-accent"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
