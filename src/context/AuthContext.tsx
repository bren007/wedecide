import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { PerformanceMarkers, markPerformance, measurePerformance } from '../utils/performance';

interface User {
  id: string;
  email: string;
  name: string;
  organization_id: string;
  roles: string[];
}


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isChair: boolean;
  isAdmin: boolean;
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

  // Track the current profile fetch promise to prevent concurrent fetches
  const profileFetchRef = React.useRef<Promise<User | null> | null>(null);
  const initialFetchDoneRef = React.useRef(false);
  const lastProcessedUserIdRef = React.useRef<string | null>(null);

  // Fetch user profile from users table with optional retries
  const fetchUserProfile = async (
    supabaseUser: SupabaseUser,
    retryCount = 0
  ): Promise<User | null> => {
    const userId = supabaseUser.id;
    // VERY STRICT retry policy during initial boot
    const maxRetries = 2; // Always allow retries
    const currentTimeoutMs = 15000; // Increased from 5s to 15s

    if (retryCount === 0) {
      markPerformance(PerformanceMarkers.PROFILE_FETCH_START);
    }

    // If a fetch is already in flight for this user, return the existing promise
    if (profileFetchRef.current) {
      console.log(`🔗 [fetchUserProfile] Sharing promise for: ${userId}`);
      return profileFetchRef.current;
    }

    const fetchPromise = (async () => {
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), currentTimeoutMs)
      );

      try {
        console.log(`📡 [fetchUserProfile] Querying DB (${retryCount + 1}/${maxRetries + 1}) for: ${userId} (Timeout: ${currentTimeoutMs}ms)`);
        const dbQuery = supabase
          .from('users')
          .select('id, email, name, organization_id')
          .eq('id', userId)
          .single();

        const { data: profile, error: profileError } = await Promise.race([
          dbQuery,
          timeoutPromise as any
        ]);

        if (profileError) {
          if (profileError.code === 'PGRST116') return null;
          throw profileError;
        }

        // Fetch roles
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('organization_id', profile.organization_id);

        if (rolesError) throw rolesError;

        console.log(`✅ [fetchUserProfile] Success: ${userId} (Roles: ${roles.length})`);
        markPerformance(PerformanceMarkers.PROFILE_FETCH_SUCCESS);
        measurePerformance('Profile Fetch Duration', PerformanceMarkers.PROFILE_FETCH_START, PerformanceMarkers.PROFILE_FETCH_SUCCESS);
        return {
          ...profile,
          roles: roles.map(r => r.role)
        } as User;

      } catch (error: any) {
        console.warn(`⚠️ [fetchUserProfile] Attempt ${retryCount + 1} failed:`, error.message || error);

        if (retryCount < maxRetries) {
          const delay = 1000; // Fixed short delay for retries
          await new Promise(resolve => setTimeout(resolve, delay));
          // IMPORTANT: Do NOT clear profileFetchRef.current here if we are about to retry,
          // so other calls still wait for the same retry chain.
          return fetchUserProfile(supabaseUser, retryCount + 1);
        }

        return null; // Give up
      }
    })();

    const trackedPromise = fetchPromise.finally(() => {
      if (profileFetchRef.current === trackedPromise) {
        profileFetchRef.current = null;
      }
    });

    profileFetchRef.current = trackedPromise;
    return trackedPromise;
  };

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;
    markPerformance(PerformanceMarkers.AUTH_INIT_START);

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const currentUserId = session?.user?.id || null;

      // De-bounce & Handle Boot Phase
      // 1. Skip premature SIGNED_IN during initial boot ONLY if it has no session
      if (event === 'SIGNED_IN' && !session?.user && !initialFetchDoneRef.current) {
        console.log('⏭️ Boot Phase: Skipping premature SIGNED_IN (No Session); waiting for INITIAL_SESSION');
        return;
      }

      // 2. Clear sign out immediately
      if (event === 'SIGNED_OUT' || !session?.user) {
        lastProcessedUserIdRef.current = null;
        setUser(null);
        setIsLoading(false);
        initialFetchDoneRef.current = true;
        return;
      }

      // 3. De-bounce: If we've already started processing this user, skip
      if (currentUserId === lastProcessedUserIdRef.current && user?.id === currentUserId) {
        console.log('⏭️ Skipping: User already processed');
        // Still mark initialization as done if it wasn't
        if (!initialFetchDoneRef.current) {
          initialFetchDoneRef.current = true;
          markPerformance(PerformanceMarkers.AUTH_INIT_END);
          measurePerformance('Auth Initialization', PerformanceMarkers.AUTH_INIT_START, PerformanceMarkers.AUTH_INIT_END);
          setIsLoading(false);
        }
        return;
      }

      lastProcessedUserIdRef.current = currentUserId;

      // ONLY set loading if we don't already have the correct user
      if (user?.id !== currentUserId) {
        setIsLoading(true);
      }

      try {
        console.log('⏳ Processing profile for:', currentUserId);
        const profile = await fetchUserProfile(session.user);

        if (mounted) {
          if (profile) {
            console.log('✅ Auth success');
            setUser(profile);
          } else {
            console.warn('⚠️ No profile found');
            setUser(null);
          }
        }
      } catch (err) {
        console.error('❌ Auth process failed:', err);
      } finally {
        if (mounted) {
          // Special handling for the very first event (usually SIGNED_IN during boot)
          // If it fails but we haven't seen INITIAL_SESSION yet, we might want to stay in loading
          // But for simplicity, we just set initialFetchDone to true once ANY event completes
          initialFetchDoneRef.current = true;
          setIsLoading(false);
        }
      }
    });

    // Fallback: Check session once in case onAuthStateChange is slow
    // Give it 1 second to emit INITIAL_SESSION naturally
    setTimeout(() => {
      if (mounted && !initialFetchDoneRef.current) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (mounted && !initialFetchDoneRef.current && !session) {
            console.log('🏁 getSession Fallback (No Session)');
            setIsLoading(false);
            initialFetchDoneRef.current = true;
          }
        });
      }
    }, 1000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Only subscribe once on mount

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

  const signup = async (name: string, email: string, password: string, token?: string) => {
    // First, sign up with Supabase Auth
    // Store name in metadata so it's available for triggers/functions
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Signup failed - no user returned');
    }

    console.log('🔵 Signup successful. User ID:', authData.user.id);
    console.log('🔵 Session exists:', !!authData.session);

    try {
      console.log('🔵 Starting signup process via RPC...');

      if (token) {
        // FLOW A: Join existing organization via Invitation
        console.log('🔵 Joining organization via invitation...', { token });

        const { data: rpcData, error: rpcError } = await supabase.rpc('accept_invitation', {
          p_token: token
        });

        if (rpcError) {
          console.error('❌ RPC Error (accept_invitation):', rpcError);
          throw new Error(`Failed to join organization: ${rpcError.message}`);
        }

        console.log('✅ Invitation accepted:', rpcData);

      } else {
        // FLOW B: Create new organization
        console.log('🔵 Creating new organization...');

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
      }

      // Fetch the created profile ONLY if we have a session
      if (authData.session) {
        const profile = await fetchUserProfile(authData.user);

        if (profile) {
          console.log('✅ Signup complete! Profile:', profile);
          setUser(profile);
        } else {
          console.error('❌ Failed to fetch profile after creation (returned null)');
        }
      } else {
        console.log('🔵 No session returned (email confirmation likely required). Skipping profile fetch.');
      }
    } catch (error) {
      console.error('Signup process error:', error);
      throw error;
    }
  };

  const logout = async () => {
    const userId = user?.id;
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    // Clear user-specific draft if it exists
    if (userId) {
      localStorage.removeItem(`wedecide_decision_draft_${userId}`);
    }
    setUser(null);
  };

  const hasRole = (role: string) => user?.roles.includes(role) || false;

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    hasRole,
    isChair: hasRole('chair'),
    isAdmin: hasRole('admin') || hasRole('chair'), // Chair is always an admin by default UX
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
