
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Callback = () => {
  const { processAuthCallback } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await processAuthCallback();
        navigate('/');
      } catch (error) {
        console.error('Error processing callback:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [processAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing login...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-monkey-accent mx-auto"></div>
      </div>
    </div>
  );
};

export default Callback;
