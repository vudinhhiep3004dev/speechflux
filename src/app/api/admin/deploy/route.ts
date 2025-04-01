import { NextRequest, NextResponse } from 'next/server';
import { deployEdgeFunctions, deployAllEdgeFunctions, getEdgeFunctionStatus } from '@/lib/utils/edge-deployment';
import { createClient } from '@/utils/supabase/server';

/**
 * Edge function deployment admin API
 */
export async function POST(req: NextRequest) {
  try {
    // Check admin authorization
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify admin role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
      
    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const { functions, deployAll = false } = await req.json();
    
    let deploymentResults;
    
    if (deployAll) {
      // Deploy all functions
      deploymentResults = await deployAllEdgeFunctions();
    } else if (Array.isArray(functions) && functions.length > 0) {
      // Deploy specific functions
      const configs = functions.map(fn => ({
        functionName: fn.name,
        sourceDir: fn.sourceDir,
        importMap: fn.importMap,
        env: fn.env
      }));
      
      deploymentResults = await deployEdgeFunctions(configs);
    } else {
      return NextResponse.json(
        { success: false, error: 'No functions specified for deployment' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      results: deploymentResults
    });
  } catch (error) {
    console.error('Deployment error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Get edge function deployment status
 */
export async function GET(req: NextRequest) {
  try {
    // Check admin authorization
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify admin role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
      
    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Get deployment status for all functions
    const functionStatus = await getEdgeFunctionStatus();
    
    return NextResponse.json({
      success: true,
      functions: functionStatus
    });
  } catch (error) {
    console.error('Error getting function status:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 