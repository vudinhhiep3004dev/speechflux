import { NextRequest, NextResponse } from 'next/server';
import { checkSystemHealth } from '@/lib/utils/monitoring';
import { createClient } from '@/utils/supabase/server';

/**
 * System health check endpoint
 * GET /api/monitoring/health
 * 
 * Returns system health status information
 * Requires admin role to access detailed information
 */
export async function GET(req: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check if the request includes an API key for admin access
    const apiKey = req.headers.get('x-api-key');
    const isAdmin = apiKey === process.env.MONITORING_API_KEY;
    
    // For non-admin requests, return basic health check
    if (!isAdmin) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Only authenticated users can see basic health status
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Get health status but return limited information
      const health = await checkSystemHealth();
      
      return NextResponse.json({
        success: true,
        status: health.status,
        timestamp: health.lastCheck
      });
    }
    
    // For admin requests, return full health information
    const health = await checkSystemHealth();
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      health,
      responseTime
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'unhealthy'
      },
      { status: 500 }
    );
  }
} 