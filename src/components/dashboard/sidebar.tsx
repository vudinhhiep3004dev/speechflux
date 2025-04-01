'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Settings 
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  disabled?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Files",
      href: "/dashboard/files",
      icon: FileText,
    },
    {
      title: "Upload",
      href: "/dashboard/upload",
      icon: Upload,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden border-r bg-background lg:block lg:w-64">
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="flex h-14 items-center border-b px-4 py-2">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="text-lg">SpeechFlux</span>
          </Link>
        </div>
        <nav className="grid gap-1 px-2 py-4">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                pathname === item.href
                  ? "bg-muted hover:bg-muted"
                  : "hover:bg-transparent hover:underline",
                "justify-start"
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
} 