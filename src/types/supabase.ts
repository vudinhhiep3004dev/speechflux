export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      files: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_path: string
          content_type: string
          size: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          file_path: string
          content_type: string
          size: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          file_path?: string
          content_type?: string
          size?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transcripts: {
        Row: {
          id: string
          file_id: string
          status: string
          language: string
          current_version_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          file_id: string
          status?: string
          language?: string
          current_version_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          file_id?: string
          status?: string
          language?: string
          current_version_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transcript_versions: {
        Row: {
          id: string
          transcript_id: string
          content: string
          user_id: string
          created_at: string
          restored_from_version_id: string | null
        }
        Insert: {
          id?: string
          transcript_id: string
          content: string
          user_id: string
          created_at?: string
          restored_from_version_id?: string | null
        }
        Update: {
          id?: string
          transcript_id?: string
          content?: string
          user_id?: string
          created_at?: string
          restored_from_version_id?: string | null
        }
      }
      translations: {
        Row: {
          id: string
          transcript_id: string
          content: string
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transcript_id: string
          content: string
          language: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transcript_id?: string
          content?: string
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
      summaries: {
        Row: {
          id: string
          transcript_id: string
          content: string
          length: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transcript_id: string
          content: string
          length: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transcript_id?: string
          content?: string
          length?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type UserProfile = Tables<'profiles'>
export type FileRecord = Tables<'files'>
export type TranscriptRecord = Tables<'transcripts'>
export type TranscriptVersionRecord = Tables<'transcript_versions'>
export type TranslationRecord = Tables<'translations'>
export type SummaryRecord = Tables<'summaries'>

export interface Session {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  user: User
}

export interface User {
  id: string
  app_metadata: {
    provider?: string
    providers?: string[]
  }
  user_metadata: {
    avatar_url?: string
    email?: string
    email_verified?: boolean
    full_name?: string
    iss?: string
    name?: string
    picture?: string
    provider_id?: string
    sub?: string
  }
  aud: string
  confirmation_sent_at?: string
  email?: string
  created_at: string
  confirmed_at?: string
  last_sign_in_at?: string
  role?: string
  updated_at?: string
}

export interface AuthChangeEvent {
  SIGNED_IN: 'SIGNED_IN'
  SIGNED_OUT: 'SIGNED_OUT'
  USER_UPDATED: 'USER_UPDATED'
  PASSWORD_RECOVERY: 'PASSWORD_RECOVERY'
  TOKEN_REFRESHED: 'TOKEN_REFRESHED'
  USER_DELETED: 'USER_DELETED'
} 