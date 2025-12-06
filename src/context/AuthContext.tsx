import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from users table
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);

        // If user doesn't exist in users table, sign them out
        // This handles orphaned auth users from failed signups
        if (error.code === 'PGRST116') {
          console.log('User profile not found, signing out...');
          await supabase.auth.signOut();
        }

        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user).then(setUser);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user);
        setUser(profile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      const profile = await fetchUserProfile(data.user);
      setUser(profile);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    // First, sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Signup failed - no user returned');
    }

    try {
      console.log('🔵 Starting signup process via RPC...');

      // Generate a slug from the user's name or email
      const orgSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || email.split('@')[0];

      // Add timestamp to ensure uniqueness
      const uniqueSlug = `${orgSlug}-${Date.now()}`;

      console.log('🔵 Calling create_signup_data function...', {
        email,
        name,
        slug: uniqueSlug
      });

      // Call the Security Definer function
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_signup_data', {
        p_user_id: authData.user.id,
        p_email: email,
        p_name: name,
        p_org_name: `${name}'s Organization`,
        p_org_slug: uniqueSlug
      });

      if (rpcError) {
        console.error('❌ RPC Error:', rpcError);
        throw new Error(`Failed to create account data: ${rpcError.message}`);
      }

      console.log('✅ Signup data created successfully:', rpcData);

      // Fetch the created profile
      console.log('🔵 Fetching user profile...');
      const profile = await fetchUserProfile(authData.user);

      if (profile) {
        console.log('✅ Signup complete! Profile:', profile);
        setUser(profile);
      } else {
        console.error('❌ Failed to fetch profile after creation');
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Signup process error:', error);
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
