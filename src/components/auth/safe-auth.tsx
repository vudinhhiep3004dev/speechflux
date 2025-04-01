'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

// Empty auth state for SSR fallback
const emptyAuthState = {
  user: null,
  session: null,
  loading: false,
  signIn: async () => {},
  signInWithMagicLink: async () => {},
  signUp: async () => {},
  signOut: async () => {},
};

type AuthContextType = typeof emptyAuthState;

// Create a context with default values
const SafeAuthContext = createContext<AuthContextType>(emptyAuthState);

/**
 * Provider component that wraps app and makes auth object available
 */
export function SafeAuthProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <SafeAuthContext.Provider value={emptyAuthState}>
      {children}
    </SafeAuthContext.Provider>
  );
}

/**
 * Hook for components to get the auth object and re-render when it changes
 */
export function useSafeAuth() {
  const context = useContext(SafeAuthContext);
  
  if (context === undefined) {
    throw new Error('useSafeAuth must be used within a SafeAuthProvider');
  }
  
  return context;
} 