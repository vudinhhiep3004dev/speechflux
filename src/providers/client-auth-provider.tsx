'use client';

import { AuthProvider } from './auth-provider';
import { ReactNode, useEffect, useState } from 'react';

// Simple shell that has same structure as AuthProvider output
function AuthProviderFallback({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      {children}
    </div>
  );
}

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only render the auth provider on the client side
  if (!isMounted) {
    return <AuthProviderFallback>{children}</AuthProviderFallback>;
  }

  return <AuthProvider>{children}</AuthProvider>;
} 