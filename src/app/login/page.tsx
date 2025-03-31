'use client'

import { useState } from 'react'
import { login, signup } from './actions'

export default function LoginPage() {
  const [formState, setFormState] = useState<{ error?: string; success?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (formData: FormData) => {
    setIsLoading(true)
    setFormState({})
    
    try {
      const result = await login(formData)
      if (result?.error) {
        setFormState({ error: result.error })
      }
    } catch (error) {
      setFormState({ error: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (formData: FormData) => {
    setIsLoading(true)
    setFormState({})
    
    try {
      const result = await signup(formData)
      if (result?.error) {
        setFormState({ error: result.error })
      } else if (result?.success) {
        setFormState({ success: result.success })
      }
    } catch (error) {
      setFormState({ error: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-300 bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Welcome to SpeechFlux</h1>
        
        {formState.error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
            {formState.error}
          </div>
        )}
        
        {formState.success && (
          <div className="mb-4 rounded bg-green-100 p-3 text-green-700">
            {formState.success}
          </div>
        )}
        
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              formAction={handleLogin}
              disabled={isLoading}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Log in'}
            </button>
            
            <button
              type="submit"
              formAction={handleSignup}
              disabled={isLoading}
              className="flex-1 rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 