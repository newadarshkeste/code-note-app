'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  signOut, 
  AuthError, 
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth || !firestore) {
        setLoading(false);
        return;
    }

    // This handles the result of the redirect after the user signs in with Google
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          const user = result.user;
          // User signed in via redirect, now create their document if it doesn't exist
          const userRef = doc(firestore, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              id: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            });
          }
        }
      })
      .catch(error => {
        // This can happen if the user closes the popup or on other errors.
        // It's generally safe to ignore this during initialization.
        console.warn("getRedirectResult error:", error.message);
      });


    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, see if we need to create a user document
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          // New user, create a document for them.
          // This handles email signups and acts as a fallback for getRedirectResult.
          await setDoc(userRef, {
            id: user.uid,
            displayName: user.displayName || user.email, // Fallback for email signup
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
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      if ((error as AuthError).code !== 'auth/popup-closed-by-user') {
        console.error("Error during Google sign-in redirect:", error);
      }
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<boolean> => {
    if (!auth) return false;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      const authError = error as AuthError;
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: authError.message || 'An unexpected error occurred.',
      });
      return false;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    if (!auth) return false;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      const authError = error as AuthError;
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: authError.message || 'Invalid credentials. Please try again.',
      });
      return false;
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = { user, loading, loginWithGoogle, signUpWithEmail, signInWithEmail, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
