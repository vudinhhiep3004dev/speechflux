'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Upload, FileText, Settings, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SideNav() {
  const pathname = usePathname();
  
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
      current: pathname === '/dashboard/files' || pathname.startsWith('/dashboard/file/'),
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      current: pathname === '/dashboard/settings',
    },
  ];

  return (
    <div className="h-full py-6 pr-6">
      <nav className="flex flex-col h-full space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
              item.current
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        <Button className="w-full justify-start" asChild>
          <Link href="/dashboard/upload">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Upload
          </Link>
        </Button>
      </div>
    </div>
  );
} 