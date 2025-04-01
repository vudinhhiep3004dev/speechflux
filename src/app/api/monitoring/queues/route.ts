import { NextRequest, NextResponse } from 'next/server';
import { getQueueStats, recordApiMetrics } from '@/lib/utils/monitoring';
import { createClient } from '@/utils/supabase/server';

/**
 * Queue statistics endpoint
 * GET /api/monitoring/queues
 * 
 * Returns statistics for all job queues
 * Requires admin access for detailed stats
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  let isError = false;
  
  try {
    // Check if the request includes an API key for admin access
    const apiKey = req.headers.get('x-api-key');
    const isAdmin = apiKey === process.env.MONITORING_API_KEY;
    
    // For non-admin requests, check authentication
    if (!isAdmin) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Only authenticated users can see basic stats
      if (!user) {
        isError = true;
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Check if user has admin role in auth.users table
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
        
      if (!userRole || userRole.role !== 'admin') {
        isError = true;
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }
    
    // Get queue statistics
    const stats = await getQueueStats();
    
    // Add summary information
    const summary = {
      totalJobs: stats.reduce((total, queue) => total + queue.size, 0),
      totalErrors: stats.reduce((total, queue) => total + queue.recentErrors, 0),
      queuesWithJobs: stats.filter(queue => queue.size > 0).length,
      timestamp: new Date().toISOString()
    };
    
    const responseTime = Date.now() - startTime;
    
    // Record API metrics
    await recordApiMetrics('monitoring/queues', responseTime, isError);
    
    return NextResponse.json({
      success: true,
      queues: stats,
      summary,
      responseTime
    });
  } catch (error) {
    isError = true;
    console.error('Queue stats error:', error);
    
    const responseTime = Date.now() - startTime;
    
    // Record API metrics
    await recordApiMetrics('monitoring/queues', responseTime, isError);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
} 