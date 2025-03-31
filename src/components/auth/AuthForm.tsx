import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';

export default function AuthForm() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if user is already authenticated
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };

    checkUser();
  }, [router]);

  // Only render Auth component after mounting to avoid hydration errors
  if (!mounted) return null;

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg border border-border">
      <h2 className="text-2xl font-bold mb-6 text-center">Welcome to SpeechFlux</h2>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        theme="light"
        providers={['google', 'github']}
        redirectTo={`${window.location.origin}/api/auth/callback`}
        magicLink={true}
      />
    </div>
  );
} 