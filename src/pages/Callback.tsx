
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Callback = () => {
  const { processAuthCallback } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await processAuthCallback();
        navigate('/');
      } catch (error: any) {
        console.error('Error processing callback:', error);
        setError(error?.message || 'An error occurred during login. Please try again.');
        setTimeout(() => navigate('/login'), 3000); // Redirect to login after showing error
      }
    };

    handleCallback();
  }, [processAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
      <div className="text-center">
        {error ? (
          <div>
            <h1 className="text-2xl font-bold mb-4 text-red-500">Login Error</h1>
            <p className="text-white mb-4">{error}</p>
            <p className="text-monkey-subtle">Redirecting to login page...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4 text-white">Processing login...</h1>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-monkey-accent mx-auto"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default Callback;
