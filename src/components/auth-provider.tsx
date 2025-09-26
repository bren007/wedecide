
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import type { AuthenticatedUser, UserProfile } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';

type AuthContextType = {
  user: AuthenticatedUser | null;
  loading: boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const tokenResult = await firebaseUser.getIdTokenResult();
        const profile = tokenResult.claims as UserProfile;
        
        const userWithProfile: AuthenticatedUser = Object.assign(firebaseUser, { profile });

        // Set up a real-time listener for the user's profile document
        const profileUnsubscribe = onSnapshot(doc(db, `users/${firebaseUser.uid}`), (doc) => {
            if (doc.exists()) {
                const updatedProfile = doc.data() as UserProfile;
                 const updatedUser: AuthenticatedUser = Object.assign(firebaseUser, { profile: updatedProfile });
                 setUser(updatedUser);
            }
             setLoading(false);
        });

        setUser(userWithProfile);
        
        return () => profileUnsubscribe();

      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Handled by onAuthStateChanged
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  if (loading) {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="h-24 w-24 rounded-full" />
        </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
