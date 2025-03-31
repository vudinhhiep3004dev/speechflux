import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function PrivatePage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-300 bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold">Protected Page</h1>
        <p className="mb-4">
          Hello <span className="font-medium">{data.user.email}</span>, you are successfully authenticated!
        </p>
        <p className="mb-4">User ID: {data.user.id}</p>
        <p className="mb-6 text-sm text-gray-600">
          This page is only accessible to authenticated users.
        </p>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
} 