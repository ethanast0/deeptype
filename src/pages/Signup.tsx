
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signup, isLoading, signInWithCognito } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    try {
      await signup(username, email, password);
      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
      });
      navigate('/');
    } catch (error: any) {
      console.error("Signup error:", error);
      const errorMessage = error.message || "There was an error creating your account. Please try again.";
      
      // Handle specific Supabase errors
      if (errorMessage.includes("User already registered")) {
        setError("This email is already registered. Please use a different email or log in.");
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleCognitoSignIn = async () => {
    try {
      await signInWithCognito();
      // The redirect will happen automatically; no need to navigate here
    } catch (error: any) {
      console.error("Cognito login error:", error);
      setError(error.message || "Failed to sign in with Amazon Cognito. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Header />
      
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-10 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              <span className="text-monkey-accent">Create</span> account
            </CardTitle>
            <CardDescription className="text-center text-monkey-subtle">
              Enter your information to sign up
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm text-monkey-subtle">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm text-monkey-subtle">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm text-monkey-subtle">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm text-monkey-subtle">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-monkey-accent hover:bg-monkey-accent/90 text-slate-900"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-800 px-2 text-xs text-monkey-subtle">
                  OR CONTINUE WITH
                </span>
              </div>
            </div>

            <Button 
              onClick={handleCognitoSignIn}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white"
              type="button"
            >
              Amazon Cognito
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-center text-sm text-monkey-subtle">
              Already have an account?{" "}
              <Link to="/login" className="text-monkey-accent hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Signup;
