'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useAuth as useFirebaseAuth, useFirebase, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, see if we need to create a user document
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await require('firebase/firestore').getDoc(userRef);
        if (!userSnap.exists()) {
          // New user, create a document for them
          await setDoc(userRef, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });
        } else {
          // Existing user, update last login time
          await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        }
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error during Google sign-in:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = { user, loading, loginWithGoogle, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
