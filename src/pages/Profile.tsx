
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Loader2 } from 'lucide-react';

const Profile = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-900">
        <Header />
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-10 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-monkey-accent" />
            <p className="mt-2 text-monkey-subtle">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Header />
      
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-10 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              <span className="text-monkey-accent">Your</span> profile
            </CardTitle>
            <CardDescription className="text-center text-monkey-subtle">
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm text-monkey-subtle">Username</h3>
              <p className="text-lg">{user.username}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm text-monkey-subtle">Email</h3>
              <p className="text-lg">{user.email}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm text-monkey-subtle">Account ID</h3>
              <p className="text-monkey-subtle">{user.id}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : "Logout"}
            </Button>
          </CardFooter>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
