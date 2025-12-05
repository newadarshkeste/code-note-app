
// IMPORTANT: Do not directly modify this file.
// The configuration is now loaded from environment variables.
// See the .env file at the root of your project.

// This configuration is used as a fallback for local development if environment variables are not set.
const fallbackConfig = {
  apiKey: "AIzaSyDKCyoUra7flq9o_j66ar2MldUiYko-KX4",
  authDomain: "studio-515431495-3fb61.firebaseapp.com",
  projectId: "studio-515431495-3fb61",
  storageBucket: "studio-515431495-3fb61.appspot.com",
  appId: "1:333623393014:web:172cc38f4bb0bf83dc4ad7",
  messagingSenderId: "333623393014",
  measurementId: "",
};

// In Next.js, environment variables prefixed with NEXT_PUBLIC_ are exposed to the browser.
// We prioritize environment variables for security and flexibility in different environments (dev, prod).
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || fallbackConfig.appId,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId,
};
