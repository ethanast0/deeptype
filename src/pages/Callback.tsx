
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const Callback = () => {
  const { processAuthCallback } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsProcessing(true);
        await processAuthCallback();
        navigate('/');
      } catch (error: any) {
        console.error('Error processing callback:', error);
        setError(error?.message || 'An error occurred during login. Please try again.');
        // After showing error for a moment, redirect to login
        setTimeout(() => navigate('/login'), 5000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [processAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
      <div className="text-center max-w-md w-full p-6 bg-slate-800 rounded-lg shadow-lg">
        {error ? (
          <div>
            <h1 className="text-2xl font-bold mb-4 text-red-500">Login Error</h1>
            <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-900">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="text-monkey-subtle mt-4">Redirecting to login page in 5 seconds...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4 text-white">Processing login...</h1>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-monkey-accent mx-auto"></div>
            <p className="text-monkey-subtle mt-4">Please wait while we complete your authentication.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Callback;
