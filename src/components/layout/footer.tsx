import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold">SpeechFlux</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Convert speech to text, translate, and summarize with the power of AI.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <span className="sr-only">Twitter</span>
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
                  className="h-5 w-5"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <span className="sr-only">GitHub</span>
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
                  className="h-5 w-5"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/features"
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/documentation"
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-800">
          <p className="text-center text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} SpeechFlux. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 