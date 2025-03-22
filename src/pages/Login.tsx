import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const { login, isLoading, user, resendConfirmationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const redirectedFrom = useRef(location.state?.from || '/');
  const loginAttempt = useRef(false);

  // Clear any old auth errors when component mounts
  useEffect(() => {
    setError(null);
    
    // Check if we're coming back with a verified parameter
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      toast({
        title: "Email Verified",
        description: "Your email has been verified. You can now log in.",
      });
    }
  }, [location, toast]);

  // Redirect if already logged in
  useEffect(() => {
    // Add debug log to see when this effect runs
    console.log("Login effect triggered, user state:", !!user);
    
    if (user) {
      console.log("User authenticated, navigating to home");
      // Redirect to the page they were trying to access, or home
      navigate(redirectedFrom.current || '/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowResendOption(false);
    setSubmitting(true);
    loginAttempt.current = true;
    
    if (!email || !password) {
      setError("Please fill in all fields");
      setSubmitting(false);
      return;
    }
    
    try {
      console.log("Attempting login with email:", email);
      // Clear any lingering localStorage data that might interfere
      localStorage.removeItem('supabase.auth.user.id');
      
      await login(email, password);
      
      // Success will redirect via the useEffect above
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Handle specific error cases
      if (error.code === "email_not_confirmed") {
        setError("Email not confirmed. Please check your inbox and confirm your email to log in.");
        setShowResendOption(true);
      } else {
        setError(error.message || "Invalid email or password. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    setIsResendingEmail(true);
    try {
      await resendConfirmationEmail(email);
      toast({
        title: "Email sent",
        description: "Confirmation email has been sent. Please check your inbox.",
      });
    } catch (error: any) {
      setError(error.message || "Failed to resend confirmation email. Please try again.");
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Handle case where auth is in limbo (thinks logged in but can't get profile)
  const handleForceLogout = async () => {
    try {
      // Clear all auth data
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refreshToken');
      localStorage.removeItem('supabase.auth.user.id');
      localStorage.removeItem('cached_user_profile');
      
      // Force reload the page to clear any in-memory state
      window.location.reload();
    } catch (error) {
      console.error("Error during forced logout:", error);
      // Last resort - redirect to login with cleared state
      window.location.href = '/login?reset=true';
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
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {showResendOption && (
              <div className="mb-4 text-center">
                <Button 
                  variant="outline" 
                  className="text-monkey-accent hover:text-monkey-accent/90 border-monkey-accent/50"
                  onClick={handleResendEmail}
                  disabled={isResendingEmail}
                >
                  {isResendingEmail ? 
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </> : 
                    "Resend confirmation email"
                  }
                </Button>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-monkey-subtle">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-monkey-subtle">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                  disabled={submitting}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-monkey-accent hover:bg-monkey-accent/90 text-slate-900"
                disabled={submitting || isLoading}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : "Login"}
              </Button>
            </form>
            
            {/* Emergency logout button - only show if they've tried to log in but are stuck */}
            {loginAttempt.current && isLoading && (
              <div className="mt-4 text-center">
                <p className="text-xs text-monkey-subtle mb-2">Having trouble? Try resetting your session:</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-400 hover:text-red-500 border-red-800/30"
                  onClick={handleForceLogout}
                >
                  Reset Session
                </Button>
              </div>
            )}
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
