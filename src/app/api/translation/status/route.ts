import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * API endpoint to check the status of a translation
 */
export async function GET(req: NextRequest) {
  try {
    // Get the translation ID from the query parameters
    const url = new URL(req.url);
    const translationId = url.searchParams.get('id');
    
    if (!translationId) {
      return NextResponse.json(
        { success: false, error: 'Missing translation ID' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the translation record
    const { data: translation, error: translationError } = await supabase
      .from('translations')
      .select('*')
      .eq('id', translationId)
      .single();
    
    if (translationError) {
      return NextResponse.json(
        { success: false, error: 'Translation not found' },
        { status: 404 }
      );
    }
    
    // Check that the user owns the translation
    if (translation.owner_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to translation' },
        { status: 403 }
      );
    }
    
    // If the translation is completed, get the content
    let content = null;
    
    if (translation.status === 'completed') {
      try {
        const { data: translationContent, error: storageError } = await supabase
          .storage
          .from('translations')
          .download(translation.storage_path);
        
        if (!storageError && translationContent) {
          content = await translationContent.text();
        }
      } catch (error) {
        console.error('Error fetching translation content:', error);
        // Continue without content
      }
    }
    
    // Return the translation status and content if available
    return NextResponse.json({
      success: true,
      translation: {
        ...translation,
        content
      }
    });
  } catch (error) {
    console.error('Translation status API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 