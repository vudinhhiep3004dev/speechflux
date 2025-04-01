'use client';

import { Suspense, useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/nav';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { LoadingScreen } from '@/components/ui/loading';
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuthContext();
  const [loading, setLoading] = useState(true);

  // Check authentication on client side
  useEffect(() => {
    // Give a small delay to prevent flash of content
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !auth.user) {
      redirect('/login');
    }
  }, [loading, auth.user]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <DashboardNav />
          </header>
          <main className="flex-1 p-4 sm:p-6">
            <Suspense fallback={<div>Loading...</div>}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
} 