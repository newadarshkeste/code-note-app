
'use client';

import { useState, useEffect, useCallback } from 'react';

// This function will now only be called from within useEffect on the client
function getValueFromLocalStorage<T>(key: string, initialValue: T | (() => T)): T {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : (initialValue instanceof Function ? initialValue() : initialValue);
  } catch (error) {
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  // Initialize state with the initialValue. This runs on server and client.
  // It avoids accessing localStorage during server-side rendering.
  const [storedValue, setStoredValue] = useState(initialValue);

  // This effect runs ONLY on the client, after the component mounts.
  useEffect(() => {
    // On the client, we read the value from localStorage and update the state.
    setStoredValue(getValueFromLocalStorage(key, initialValue));
  }, [key, initialValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (typeof window === 'undefined') {
      console.warn(`Tried to set localStorage key “${key}” on the server.`);
      return;
    }
    try {
      // The state updater function allows us to get the latest value.
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}
