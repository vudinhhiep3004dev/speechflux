import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-4 text-3xl font-bold">Authentication Error</h1>
      <p className="mb-6 text-lg">
        There was a problem with the authentication process. This could be due to:
      </p>
      <ul className="mb-8 list-disc text-left">
        <li>An expired or invalid token</li>
        <li>A used confirmation link</li>
        <li>A system error</li>
      </ul>
      <p className="mb-8">
        Please try signing in again, or contact support if the problem persists.
      </p>
      <Link
        href="/login"
        className="rounded bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
      >
        Go to Login
      </Link>
    </div>
  )
} 