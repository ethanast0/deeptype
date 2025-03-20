
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Helper function to get all users
  const getAllUsers = (): User[] => {
    const users = localStorage.getItem("users");
    return users ? JSON.parse(users) : [];
  };

  // Helper function to save users
  const saveUsers = (users: User[]) => {
    localStorage.setItem("users", JSON.stringify(users));
  };

  // Helper function to associate temporary scripts with user
  const associateTempScriptsWithUser = (user: User) => {
    const tempScripts = localStorage.getItem("temp_script");
    if (tempScripts) {
      const parsedScript = JSON.parse(tempScripts);
      
      // Get existing scripts from storage
      const storageKey = 'typetest_saved_scripts';
      const existingScripts = localStorage.getItem(storageKey);
      const allScripts = existingScripts ? JSON.parse(existingScripts) : [];
      
      // Add the temp script with the user's ID
      const newScript = {
        ...parsedScript,
        userId: user.id,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        category: 'Custom'
      };
      
      allScripts.push(newScript);
      localStorage.setItem(storageKey, JSON.stringify(allScripts));
      
      // Clear the temp script
      localStorage.removeItem("temp_script");
    }
  };

  useEffect(() => {
    // Check localStorage for existing user session
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Initialize users array if it doesn't exist
    if (!localStorage.getItem("users")) {
      localStorage.setItem("users", JSON.stringify([]));
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Get all users
      const users = getAllUsers();
      
      // Find user with matching email
      const foundUser = users.find(u => u.email === email);
      if (!foundUser) {
        throw new Error("User not found");
      }
      
      // In a real app, you would verify the password here
      // For this mock implementation, we're just checking if the user exists
      
      setUser(foundUser);
      localStorage.setItem("user", JSON.stringify(foundUser));

      // Associate any temporary scripts with this user
      associateTempScriptsWithUser(foundUser);
      
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Get all users
      const users = getAllUsers();
      
      // Check if email already exists
      if (users.some(u => u.email === email)) {
        toast({
          title: "Email already in use",
          description: "This email is already registered. Please login or use a different email.",
          variant: "destructive"
        });
        throw new Error("Email already exists");
      }
      
      // Create new user
      const newUser: User = {
        id: crypto.randomUUID(), // More reliable UUID generation
        username,
        email,
        createdAt: new Date().toISOString()
      };
      
      // Add user to users array
      users.push(newUser);
      saveUsers(users);
      
      // Set as current user
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      
      // Associate any temporary scripts with this user
      associateTempScriptsWithUser(newUser);
      
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
