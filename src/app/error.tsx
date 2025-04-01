'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-4 text-3xl font-bold">Something went wrong!</h1>
      <p className="mb-6 text-lg">
        We&apos;ve encountered an unexpected error.
      </p>
      <div className="mb-8 space-y-4">
        <button
          onClick={reset}
          className="rounded bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
        >
          Try again
        </button>
        <div>
          <Link
            href="/"
            className="rounded bg-gray-600 px-6 py-2 text-white transition hover:bg-gray-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 