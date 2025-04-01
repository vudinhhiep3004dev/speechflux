'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  RefreshCw,
  Server,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/utils/supabase/client';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { QueueStats, ApiStats, SystemHealth } from '@/lib/utils/monitoring';

export default function MonitoringPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [queues, setQueues] = useState<QueueStats[]>([]);
  const [apiStats, setApiStats] = useState<ApiStats[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
    fetchData();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkAdminAccess = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user has admin role
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!userRole || userRole.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify your access permissions.',
        variant: 'destructive',
      });
    }
  };

  const fetchData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      // Fetch health check data
      const healthResponse = await fetch('/api/monitoring/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealth(healthData.health);
      }

      // Fetch queue stats
      const queuesResponse = await fetch('/api/monitoring/queues');
      if (queuesResponse.ok) {
        const queuesData = await queuesResponse.json();
        setQueues(queuesData.queues);
      }

      // TODO: Fetch API stats when available
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load monitoring data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTime = (ms: number | null) => {
    if (!ms) return 'N/A';
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      case 'unhealthy':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
      case 'backlogged':
        return 'bg-yellow-500';
      case 'unhealthy':
      case 'stalled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              This page is only available to administrators.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor system health, queues, and performance
          </p>
        </div>
        <Button
          onClick={() => fetchData(false)}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">System Health</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {health ? getHealthIcon(health.status) : <Clock className="h-6 w-6 text-gray-500" />}
                  <span className="ml-2 font-bold capitalize">
                    {health?.status || 'Unknown'}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`${health ? getStatusColor(health.status) : 'bg-gray-500'} text-white`}
                >
                  {health?.lastCheck
                    ? formatDistanceToNow(new Date(health.lastCheck), {
                        addSuffix: true,
                      })
                    : 'Unknown'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Redis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="h-6 w-6 text-blue-500" />
                  <span className="ml-2 font-bold">
                    {health?.redisConnection ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`${
                    health?.redisConnection
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  } text-white`}
                >
                  {health?.redisConnection ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Supabase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Server className="h-6 w-6 text-purple-500" />
                  <span className="ml-2 font-bold">
                    {health?.supabaseConnection
                      ? 'Connected'
                      : 'Disconnected'}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`${
                    health?.supabaseConnection
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  } text-white`}
                >
                  {health?.supabaseConnection ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-6 w-6 text-orange-500" />
                  <span className="ml-2 font-bold">
                    {queues.length} Queues
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`${
                    queues.some(
                      (q) => q.size > 50 || q.recentErrors > 0
                    )
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  } text-white`}
                >
                  {queues.reduce((acc, q) => acc + q.size, 0)} Jobs
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Queue Statistics</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Processing Rate</TableHead>
                <TableHead>Avg. Processing Time</TableHead>
                <TableHead>Oldest Job</TableHead>
                <TableHead>Recent Errors</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No queue data available
                  </TableCell>
                </TableRow>
              ) : (
                queues.map((queue) => (
                  <TableRow key={queue.name}>
                    <TableCell className="font-medium">{queue.name}</TableCell>
                    <TableCell>{queue.size}</TableCell>
                    <TableCell>
                      {queue.processingRate}/min
                    </TableCell>
                    <TableCell>{formatTime(queue.averageProcessingTime)}</TableCell>
                    <TableCell>{formatDate(queue.oldestJob)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={queue.recentErrors > 0 ? 'destructive' : 'outline'}
                      >
                        {queue.recentErrors}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          health?.queueHealth[queue.name]
                            ? getStatusColor(health.queueHealth[queue.name])
                            : 'bg-gray-500'
                        }
                      >
                        {health?.queueHealth[queue.name] || 'unknown'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Manage Queues</CardTitle>
            <CardDescription>
              Control queue processing and clear stuck jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" variant="outline">
              Pause All Queues
            </Button>
            <Button className="w-full" variant="outline">
              Resume All Queues
            </Button>
            <Button className="w-full" variant="destructive">
              Clear Stuck Jobs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              System maintenance actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" variant="outline">
              Invalidate Redis Cache
            </Button>
            <Button className="w-full" variant="outline">
              Regenerate API Stats
            </Button>
            <Button className="w-full" variant="outline">
              Run Full System Check
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 