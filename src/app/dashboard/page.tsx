'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  description: string;
  status: string;
}

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats([
        {
          title: 'Total Files',
          value: '12',
          description: 'Files uploaded',
          status: 'success',
        },
        {
          title: 'Processing',
          value: '2',
          description: 'Files in progress',
          status: 'warning',
        },
        {
          title: 'Storage Used',
          value: '124 MB',
          description: '2 GB available',
          status: 'info',
        },
        {
          title: 'Transcription Minutes',
          value: '45',
          description: '100 minutes available',
          status: 'info',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.user_metadata?.name || user?.email || 'User'}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent file activity</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Recent activity content here */}
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>Your subscription usage</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Usage content here */}
            <p className="text-sm text-muted-foreground">Free plan</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 