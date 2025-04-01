'use client';

import { createBrowserClient } from '@supabase/ssr';
import { AuthChangeEvent, Session, User } from '@/types/supabase';
import { Database } from '@/types/supabase';

// Create a Supabase client for browser components
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Get a client instance
export const supabaseClient = createClient();

// Function to get the current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Function to get the current session
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Function to sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  } catch (error) {
    console.error('Error signing in:', error);
    return { data: null, error };
  }
}

// Function to sign up with email and password
export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    
    return { data, error };
  } catch (error) {
    console.error('Error signing up:', error);
    return { data: null, error };
  }
}

// Function to sign out
export async function signOut() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
}

// Function to reset password
export async function resetPassword(email: string) {
  try {
    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email);
    return { data, error };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { data: null, error };
  }
}

// Function to update password
export async function updatePassword(password: string) {
  try {
    const { data, error } = await supabaseClient.auth.updateUser({ password });
    return { data, error };
  } catch (error) {
    console.error('Error updating password:', error);
    return { data: null, error };
  }
}

// Function to set up an auth state change listener
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  return supabaseClient.auth.onAuthStateChange((event, session) => {
    callback(event as unknown as AuthChangeEvent, session);
  });
} 