import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Mock login - in production, this would call an API
    console.log('Login attempt:', { email, password });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock user data
    setUser({
      id: '1',
      email,
      name: email.split('@')[0],
    });
  };

  const signup = async (name: string, email: string, password: string) => {
    // Mock signup - in production, this would call an API
    console.log('Signup attempt:', { name, email, password });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock user data
    setUser({
      id: '1',
      email,
      name,
    });
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
