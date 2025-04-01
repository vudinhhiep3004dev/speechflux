import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-4 text-3xl font-bold">Error</h1>
      <p className="mb-6 text-lg">
        There was a problem processing your request. This could be due to:
      </p>
      <ul className="mb-8 list-disc text-left">
        <li>An expired or invalid session</li>
        <li>A system error</li>
        <li>Temporary service unavailability</li>
      </ul>
      <p className="mb-8">
        Please try again, or contact support if the problem persists.
      </p>
      <div className="flex space-x-4">
        <Link
          href="/login"
          className="rounded bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
        >
          Go to Login
        </Link>
        <Link
          href="/"
          className="rounded bg-gray-600 px-6 py-2 text-white transition hover:bg-gray-700"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
} 