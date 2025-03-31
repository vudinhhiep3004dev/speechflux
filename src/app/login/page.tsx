import React from 'react';
import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Login | SpeechFlux',
  description: 'Login to your SpeechFlux account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <AuthForm />
    </div>
  );
} 