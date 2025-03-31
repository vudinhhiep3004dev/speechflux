'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Upload, FileText, Settings, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/components/auth/AuthProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuthContext();
  
  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/dashboard',
    },
    {
      name: 'Upload',
      href: '/dashboard/upload',
      icon: Upload,
      current: pathname === '/dashboard/upload',
    },
    {
      name: 'Files',
      href: '/dashboard/files',
      icon: FileText,
      current: pathname === '/dashboard/files' || pathname.startsWith('/dashboard/files/'),
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      current: pathname === '/dashboard/settings',
    },
  ];
  
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-800 hidden md:block">
          <div className="h-full flex flex-col">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center justify-between flex-shrink-0 px-4">
                <Link href="/" className="text-lg font-bold">
                  SpeechFlux
                </Link>
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? 'bg-gray-200 dark:bg-gray-800 text-primary'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        item.current ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="p-4 border-t dark:border-gray-800">
              <Button className="w-full justify-start" asChild>
                <Link href="/dashboard/upload">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Upload
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <div className="md:hidden bg-white dark:bg-gray-950 border-b dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-lg font-bold">
                SpeechFlux
              </Link>
              {/* Mobile menu button placeholder */}
            </div>
            
            {/* Mobile navigation */}
            <nav className="mt-4 flex space-x-2 overflow-x-auto py-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center px-3 py-2 text-xs font-medium rounded-md ${
                    item.current
                      ? 'bg-gray-200 dark:bg-gray-800 text-primary'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon
                    className={`mb-1 h-5 w-5 ${
                      item.current ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 