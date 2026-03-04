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

const PROFILE_CACHE_KEY = 'wedecide_profile_cache_v1';


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
  ): Promise<User | null | 'NETWORK_ERROR'> => {
    const userId = supabaseUser.id;
    // VERY STRICT retry policy during initial boot
    const maxRetries = 1;

    if (retryCount === 0) {
      markPerformance(PerformanceMarkers.PROFILE_FETCH_START);
    }

    // If a fetch is already in flight for this user, return the existing promise
    // EXCEPT if we are in a retry loop (retryCount > 0), in which case we WANT to start a new fetch
    if (profileFetchRef.current && retryCount === 0) {
      console.log(`🔗 [fetchUserProfile] Sharing promise for: ${userId}`);
      return profileFetchRef.current;
    }

    // Wrap a promise with a timeout to prevent hanging
    const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: ${label} took longer than ${ms}ms`)), ms)
        ),
      ]);
    };

    const QUERY_TIMEOUT = 5000; // 5 seconds per query attempt

    const fetchPromise = (async () => {
      try {
        console.log(`📡 [fetchUserProfile] Querying DB (${retryCount + 1}/${maxRetries + 1}) for: ${userId}`);
        const { data: profile, error: profileError } = await withTimeout(
          Promise.resolve(
            supabase
              .from('users')
              .select('id, email, name, organization_id')
              .eq('id', userId)
              .single()
          ),
          QUERY_TIMEOUT,
          'users query'
        );

        if (profileError) {
          if (profileError.code === 'PGRST116') return null;
          throw profileError;
        }

        // Fetch roles
        const { data: roles, error: rolesError } = await withTimeout(
          Promise.resolve(
            supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', userId)
              .eq('organization_id', profile.organization_id)
          ),
          QUERY_TIMEOUT,
          'user_roles query'
        );

        if (rolesError) throw rolesError;

        console.log(`✅ [fetchUserProfile] Success: ${userId} (Roles: ${roles!.length})`);
        markPerformance(PerformanceMarkers.PROFILE_FETCH_SUCCESS);
        measurePerformance('Profile Fetch Duration', PerformanceMarkers.PROFILE_FETCH_START, PerformanceMarkers.PROFILE_FETCH_SUCCESS);

        const profileData: User = {
          ...profile,
          roles: roles!.map((r: { role: string }) => r.role)
        };

        // Cache the successful profile
        localStorage.setItem(`${PROFILE_CACHE_KEY}_${userId}`, JSON.stringify(profileData));

        return profileData;

      } catch (error: any) {
        console.warn(`⚠️ [fetchUserProfile] Error (attempt ${retryCount + 1}):`, error.message);

        if (retryCount < maxRetries) {
          const delay = 300; // Short retry delay
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchUserProfile(supabaseUser, retryCount + 1);
        }

        // Return a special error/marker to distinguish between "not found" and "network error"
        if (
          error.message?.includes('fetch') ||
          error.message?.includes('Network') ||
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('Timeout')
        ) {
          console.warn('📡 [fetchUserProfile] Soft failure due to network/timeout issue');
          return 'NETWORK_ERROR' as any;
        }

        return null; // Hard failure (e.g. user deleted from DB)
      }
    })();

    const trackedPromise = fetchPromise.finally(() => {
      // Only clear if this is still the active promise being tracked
      if (profileFetchRef.current === trackedPromise) {
        profileFetchRef.current = null;
      }
    });

    // Only track the initial call's promise for sharing
    if (retryCount === 0) {
      profileFetchRef.current = trackedPromise;
    }
    return trackedPromise;
  };

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;
    markPerformance(PerformanceMarkers.AUTH_INIT_START);

    // 1. Instant Boot: Try to load from cache immediately, and definitively determine no-auth state
    const initFromCache = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const cached = localStorage.getItem(`${PROFILE_CACHE_KEY}_${session.user.id}`);
          if (cached) {
            console.log('⚡ Instant Boot: Found cached profile for', session.user.id);
            setUser(JSON.parse(cached));
            setIsLoading(false); // UI can render now!
            initialFetchDoneRef.current = true;
            lastProcessedUserIdRef.current = session.user.id; // Fix: Mark as processed
          }
        } else if (mounted && !initialFetchDoneRef.current) {
          // If definitively NO session from async storage:
          console.log('⚡ Instant Boot: No session found, finalizing loading state');
          setIsLoading(false);
          initialFetchDoneRef.current = true;
        }
      } catch (e) {
        console.warn('⚠️ Cache init failed', e);
        if (mounted && !initialFetchDoneRef.current) {
          setIsLoading(false);
          initialFetchDoneRef.current = true;
        }
      }
    };
    initFromCache();

    // 2. Regular Auth Listener logic
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const currentUserId = session?.user?.id || null;

      // Handle SIGNED_OUT immediately
      // Do NOT forcefully quit on INITIAL_SESSION with no user, let getSession handle it!
      if (event === 'SIGNED_OUT' || (event !== 'INITIAL_SESSION' && !session?.user)) {
        lastProcessedUserIdRef.current = null;
        setUser(null);
        setIsLoading(false);
        initialFetchDoneRef.current = true;

        // Clear all profile caches on logout
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(PROFILE_CACHE_KEY)) localStorage.removeItem(key);
        });
        return;
      }

      if (event === 'INITIAL_SESSION' && !session?.user) {
        return; // wait for getSession (initFromCache) to definitively tell us
      }

      // De-bounce: If we've already processed this user (via cache or previous run), skip
      // We rely on refs, not state, to avoid stale interactions in this closure
      if (currentUserId === lastProcessedUserIdRef.current) {
        console.log('⏭️ Skipping: User already processed (Ref check)');
        if (!initialFetchDoneRef.current) {
          initialFetchDoneRef.current = true;
          setIsLoading(false);
        }
        return;
      }

      // Also skip TOKEN_REFRESHED events once initial fetch is done
      // (they fire on tab focus, navigation, etc. and don't need a profile re-fetch)
      if (event === 'TOKEN_REFRESHED' && initialFetchDoneRef.current) {
        console.log('⏭️ Skipping TOKEN_REFRESHED: initial fetch already done');
        lastProcessedUserIdRef.current = currentUserId;
        return;
      }

      lastProcessedUserIdRef.current = currentUserId;

      // Only show loading spinner if we DON'T already have a cached user
      const cached = localStorage.getItem(`${PROFILE_CACHE_KEY}_${currentUserId}`);
      if (!cached) {
        setIsLoading(true);
      }

      try {
        if (!session?.user) return; // Type guard for TS
        console.log('⏳ Processing profile for:', currentUserId);
        const result = await fetchUserProfile(session.user);

        if (mounted) {
          if (result === 'NETWORK_ERROR') {
            console.warn('📡 Network error during fetch, retaining existing/cached state');
            // If we have a cached user, we just stay with it.
            // If we didn't have any user, we might want to show an error, but for now we just stop loading.
            setIsLoading(false);
            initialFetchDoneRef.current = true;
          } else if (result) {
            // DEEP EQUALITY CHECK to prevent unnecessary re-renders
            // This is critical for preventing page reloads/effect triggers on window focus
            const isUnchanged = user &&
              result.id === user.id &&
              JSON.stringify(result) === JSON.stringify(user);

            if (isUnchanged) {
              console.log('✅ Auth success (State unchanged, skipping update)');
            } else {
              console.log('✅ Auth success (Updating state)');
              setUser(result);
            }
          } else {
            console.warn('⚠️ No profile found - forcing logout');
            setUser(null);
            supabase.auth.signOut(); // Ensure session is cleared if profile is gone
          }
        }
      } catch (err) {
        console.error('❌ Auth process failed:', err);
      } finally {
        if (mounted) {
          initialFetchDoneRef.current = true;
          setIsLoading(false);
        }
      }
    });

    // Fallback: 6 seconds is enough now that RLS recursion is fixed
    setTimeout(() => {
      if (mounted && !initialFetchDoneRef.current) {
        console.log('⏰ Fallback reached: Finalizing loading state');
        setIsLoading(false);
        initialFetchDoneRef.current = true;
      }
    }, 6000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Only subscribe once on mount

  // Synchronous check for cached user to avoid initial spinner
  // We use a ref to ensure this only runs once during the very first render phase
  const syncCheckDoneRef = React.useRef(false);
  if (!syncCheckDoneRef.current && !user) {
    try {
      // Find Supabase session token in localStorage (key varies by project ID)
      const sessionKey = Object.keys(localStorage).find(key => key.includes('-auth-token'));
      if (sessionKey) {
        const sessionData = JSON.parse(localStorage.getItem(sessionKey) || '{}');
        const userId = sessionData?.user?.id;
        if (userId) {
          const cachedProfile = localStorage.getItem(`${PROFILE_CACHE_KEY}_${userId}`);
          if (cachedProfile) {
            console.log('⚡ Instant Boot (sync): Found cached profile for', userId);
            const parsedProfile = JSON.parse(cachedProfile);
            // Directly update state during render for the first time
            // This is safe because we haven't rendered children yet and we use a ref to prevent loops
            setUser(parsedProfile);
            setIsLoading(false);
            initialFetchDoneRef.current = true;
          }
        }
      }
      syncCheckDoneRef.current = true;
    } catch (e) {
      console.warn('⚠️ Synchronous cache init failed', e);
      syncCheckDoneRef.current = true;
    }
  }

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      const result = await fetchUserProfile(data.user);
      if (result && result !== 'NETWORK_ERROR') {
        setUser(result);
      } else if (result === 'NETWORK_ERROR') {
        throw new Error('Connecton error. Please try again.');
      }
    }
  };

  const signup = async (name: string, email: string, password: string, token?: string) => {
    // First, sign up with Supabase Auth
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
        const result = await fetchUserProfile(authData.user);

        if (result && result !== 'NETWORK_ERROR') {
          console.log('✅ Signup complete! Profile:', result);
          setUser(result);
        } else if (result === 'NETWORK_ERROR') {
          console.error('❌ Connection error after signup');
          // Still consider signup successful if session exists, 
          // but we won't have the profile in state yet.
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
