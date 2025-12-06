
'use client';

import React, { useState, useEffect } from 'react';
import { FirebaseProvider } from "@/firebase/provider";
import { AuthProvider } from "@/context/AuthContext";
import { NotesProvider } from "@/context/NotesContext";
import { UIProvider } from "@/context/UIContext";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs once on the client after initial mount.
    const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);
    setServices({ firebaseApp, firestore, auth });
  }, []); // The empty dependency array ensures this runs only once.

  // Render nothing or a loading spinner until Firebase is initialized.
  if (!services) {
    return null; 
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      firestore={services.firestore}
      auth={services.auth}
    >
      <AuthProvider>
        <UIProvider>
            <NotesProvider>
            {children}
            </NotesProvider>
        </UIProvider>
      </AuthProvider>
    </FirebaseProvider>
  );
}
