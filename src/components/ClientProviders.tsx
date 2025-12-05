
'use client';

import React from 'react';
import { FirebaseProvider } from "@/firebase/provider";
import { AuthProvider } from "@/context/AuthContext";
import { NotesProvider } from "@/context/NotesContext";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

// This function now runs only on the client
function getFirebaseServices() {
  const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  return { firebaseApp, firestore, auth };
}


export function ClientProviders({ children }: { children: React.ReactNode }) {
  // getFirebaseServices is called inside the client component, ensuring it only runs in the browser.
  const { firebaseApp, firestore, auth } = getFirebaseServices();

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      <AuthProvider>
        <NotesProvider>
          {children}
        </NotesProvider>
      </AuthProvider>
    </FirebaseProvider>
  );
}
