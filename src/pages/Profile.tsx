
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You've been logged out successfully",
    });
    navigate('/');
  };

  if (!user) {
    navigate('/login');
    return null;
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
            >
              Logout
            </Button>
          </CardFooter>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
