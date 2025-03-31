import React from 'react';
import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Register | SpeechFlux',
  description: 'Create a new SpeechFlux account',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <AuthForm />
    </div>
  );
} 