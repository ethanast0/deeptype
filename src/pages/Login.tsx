
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const Login = () => {
  const [error, setError] = useState<string | null>(null);
  const { signInWithAuth0, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth0Login = async () => {
    setError(null);
    try {
      await signInWithAuth0();
      // Note: No need for redirect here as Auth0 will handle it
    } catch (error: any) {
      console.error("Auth0 login error:", error);
      setError("Failed to login with Auth0. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Header />
      
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-10 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              <span className="text-monkey-accent">Welcome</span> back
            </CardTitle>
            <CardDescription className="text-center text-monkey-subtle">
              Sign in to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <Button 
                type="button" 
                onClick={handleAuth0Login}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Connecting..." : "Continue with Auth0"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-center text-sm text-monkey-subtle">
              Don't have an account?{" "}
              <Link to="/signup" className="text-monkey-accent hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
