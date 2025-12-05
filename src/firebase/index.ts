
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  // Important! This check prevents server-side execution, which was causing the error.
  if (typeof window === 'undefined') {
    // On the server, return a 'null' version of the SDKs
    // to prevent errors during server-side rendering.
    // This case should not be hit with the new layout structure, but is kept for safety.
    return { firebaseApp: null, auth: null, firestore: null };
  }

  // The rest of the function now only runs on the client.
  const firebaseApp = initializeApp(firebaseConfig);
  
  return getSdks(firebaseApp);
}


export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
