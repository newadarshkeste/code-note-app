
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
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { useFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // CORRECT: Get services from useFirebase hook inside the component, which ensures context is available.
  const { auth, firestore } = useFirebase(); 
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // We can now safely assume auth and firestore are available due to the provider nesting.
    if (!auth || !firestore) {
        setLoading(false);
        return;
    };
    
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          const user = result.user;
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
        console.warn("getRedirectResult error:", error.message);
      })
      .finally(() => {
        // After handling redirect, the onAuthStateChanged listener will correctly set the user.
      });
  
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            id: user.uid,
            displayName: user.displayName || user.email,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });
        } else {
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
    setLoading(true);
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      setLoading(false);
      if ((error as AuthError).code !== 'auth/popup-closed-by-user') {
        console.error("Error during Google sign-in redirect:", error);
      }
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<boolean> => {
    if (!auth) return false;
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      setLoading(false);
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
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      setLoading(false);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: 'Invalid credentials. Please try again.',
      });
      return false;
    }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    if (!auth) return false;
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: `An email has been sent to ${email}. If you don't see it, please check your spam folder.`,
      });
      return true;
    } catch (error) {
      const authError = error as AuthError;
      toast({
        variant: 'destructive',
        title: 'Password Reset Failed',
        description: authError.message || 'Could not send reset email. Please check the address and try again.',
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

  const value = { user, loading, loginWithGoogle, signUpWithEmail, signInWithEmail, sendPasswordReset, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
