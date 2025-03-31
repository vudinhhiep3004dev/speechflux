'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './button';
import { useAuthContext } from '@/components/auth/AuthProvider';

interface AuthButtonProps {
  type: 'login' | 'logout' | 'register';
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function AuthButton({ type, className, variant = 'default' }: AuthButtonProps) {
  const { signOut, user } = useAuthContext();
  const router = useRouter();

  const handleClick = async () => {
    switch (type) {
      case 'login':
        router.push('/login');
        break;
      case 'register':
        router.push('/register');
        break;
      case 'logout':
        try {
          await signOut();
          router.push('/');
        } catch (error) {
          console.error('Error signing out:', error);
        }
        break;
    }
  };

  // Don't show login/register buttons if user is logged in
  if (user && (type === 'login' || type === 'register')) {
    return null;
  }

  // Don't show logout button if user is not logged in
  if (!user && type === 'logout') {
    return null;
  }

  const labels = {
    login: 'Sign In',
    register: 'Sign Up',
    logout: 'Sign Out',
  };

  return (
    <Button 
      variant={variant} 
      className={className}
      onClick={handleClick}
    >
      {labels[type]}
    </Button>
  );
} 