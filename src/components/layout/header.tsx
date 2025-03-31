import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-600">SpeechFlux</span>
          </Link>
          <nav className="hidden md:flex">
            <ul className="flex gap-6">
              <li>
                <Link
                  href="/features"
                  className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Sign up</Button>
          </Link>
          <button className="block md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
} 