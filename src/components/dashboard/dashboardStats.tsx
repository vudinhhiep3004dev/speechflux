'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface UsageStats {
  minutesProcessed: number;
  minutesLimit: number;
  filesUploaded: number;
  subscriptionPlan: string;
  subscriptionStatus: string;
  nextBillingDate?: string;
}

export function DashboardStats() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchUsageStats();
  }, []);
  
  const fetchUsageStats = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      // Fetch usage metrics
      const { data: usageData, error: usageError } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      // Fetch subscription info
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      // Fetch limit for the user's plan
      const { data: limitData, error: limitError } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('plan', subscriptionData?.plan || 'free')
        .single();
      
      // Count total files
      const { count: filesCount, error: filesError } = await supabase
        .from('files')
        .select('*', { count: 'exact' })
        .eq('owner_id', user.id);
      
      if (usageError || subscriptionError || limitError || filesError) {
        console.error('Error fetching stats:', { usageError, subscriptionError, limitError, filesError });
        setIsLoading(false);
        return;
      }
      
      // Format the stats data
      const formattedStats: UsageStats = {
        minutesProcessed: usageData?.minutes_processed || 0,
        minutesLimit: limitData?.minutes_per_month || 60, // Default to 60 for free tier
        filesUploaded: filesCount || 0,
        subscriptionPlan: (subscriptionData?.plan || 'Free').charAt(0).toUpperCase() + (subscriptionData?.plan || 'free').slice(1),
        subscriptionStatus: subscriptionData?.status || 'active',
        nextBillingDate: subscriptionData?.current_period_end ? new Date(subscriptionData.current_period_end).toLocaleDateString() : undefined,
      };
      
      setStats(formattedStats);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Unable to load usage statistics</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Minutes Processed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            {stats.minutesProcessed} <span className="text-sm text-muted-foreground font-normal">/ {stats.minutesLimit}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${Math.min(100, (stats.minutesProcessed / stats.minutesLimit) * 100)}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Files Uploaded</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.filesUploaded}</div>
          <p className="text-xs text-muted-foreground">Total files in your account</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.subscriptionPlan}</div>
          <p className="text-xs text-muted-foreground capitalize">{stats.subscriptionStatus} subscription</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {stats.nextBillingDate ? 'Next Billing Date' : 'Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.nextBillingDate ? (
            <>
              <div className="text-2xl font-bold">{stats.nextBillingDate}</div>
              <p className="text-xs text-muted-foreground">Your next payment date</p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">Free tier has no billing</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 