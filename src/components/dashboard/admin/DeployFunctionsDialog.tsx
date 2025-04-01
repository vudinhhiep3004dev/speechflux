'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertTriangle, 
  CheckCircle, 
  Cloud, 
  Loader2, 
  RefreshCw,
  UploadCloud
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface EdgeFunction {
  name: string;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface DeploymentResult {
  functionName: string;
  success: boolean;
  output: string | null;
  error: string | null;
}

interface DeployFunctionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeployFunctionsDialog({ open, onOpenChange }: DeployFunctionsDialogProps) {
  const [functions, setFunctions] = useState<EdgeFunction[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [deployAll, setDeployAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deploymentResults, setDeploymentResults] = useState<DeploymentResult[]>([]);
  const [activeTab, setActiveTab] = useState('functions');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchFunctions();
    }
  }, [open]);

  const fetchFunctions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/deploy');
      if (!response.ok) {
        throw new Error('Failed to fetch functions');
      }
      
      const data = await response.json();
      setFunctions(data.functions || []);
    } catch (error) {
      console.error('Error fetching functions:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to fetch functions',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFunction = (functionName: string) => {
    setSelectedFunctions(prev => {
      if (prev.includes(functionName)) {
        return prev.filter(name => name !== functionName);
      } else {
        return [...prev, functionName];
      }
    });
  };

  const handleDeployment = async () => {
    setDeploying(true);
    setDeploymentResults([]);
    setActiveTab('results');
    
    try {
      const response = await fetch('/api/admin/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functions: deployAll ? undefined : selectedFunctions.map(name => ({ name })),
          deployAll,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Deployment failed');
      }
      
      const data = await response.json();
      setDeploymentResults(data.results);
      
      const successCount = data.results.filter((r: DeploymentResult) => r.success).length;
      const totalCount = data.results.length;
      
      toast({
        title: 'Deployment complete',
        description: `Successfully deployed ${successCount}/${totalCount} functions`,
        variant: successCount === totalCount ? 'default' : 'destructive',
      });
      
      // Refresh function list
      fetchFunctions();
    } catch (error) {
      console.error('Error deploying functions:', error);
      toast({
        variant: 'destructive',
        title: 'Deployment failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setDeploying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-500">Inactive</Badge>;
      case 'error':
        return <Badge className="bg-red-500">Error</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getResultIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Deploy Edge Functions</DialogTitle>
          <DialogDescription>
            Manage and deploy Supabase Edge Functions for serverless backend operations.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="functions">Functions</TabsTrigger>
            <TabsTrigger value="results">Deployment Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="functions">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="deploy-all" 
                  checked={deployAll}
                  onCheckedChange={(checked) => {
                    setDeployAll(!!checked);
                    if (checked) {
                      setSelectedFunctions([]);
                    }
                  }}
                />
                <Label htmlFor="deploy-all">Deploy all functions</Label>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchFunctions}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <ScrollArea className="h-[350px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {functions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2">Loading...</span>
                          </div>
                        ) : (
                          'No edge functions found'
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    functions.map(fn => (
                      <TableRow key={fn.name}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedFunctions.includes(fn.name)}
                            onCheckedChange={() => handleToggleFunction(fn.name)}
                            disabled={deployAll}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{fn.name}</TableCell>
                        <TableCell>{getStatusBadge(fn.status)}</TableCell>
                        <TableCell>v{fn.version}</TableCell>
                        <TableCell>
                          {fn.updatedAt ? 
                            formatDistanceToNow(new Date(fn.updatedAt), { addSuffix: true }) : 
                            'N/A'
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
            
            {!deployAll && selectedFunctions.length === 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No functions selected</AlertTitle>
                <AlertDescription>
                  Select specific functions to deploy or enable "Deploy all functions"
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="results">
            <ScrollArea className="h-[350px] rounded-md border">
              {deploying ? (
                <div className="flex flex-col items-center justify-center h-[350px]">
                  <UploadCloud className="h-12 w-12 animate-bounce text-primary" />
                  <p className="mt-4 text-lg font-medium">Deploying functions...</p>
                  <p className="text-sm text-muted-foreground">This may take a few minutes</p>
                </div>
              ) : deploymentResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[350px]">
                  <Cloud className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No deployment results yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Function</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deploymentResults.map((result, index) => (
                      <TableRow key={`${result.functionName}-${index}`}>
                        <TableCell>{getResultIcon(result.success)}</TableCell>
                        <TableCell className="font-medium">{result.functionName}</TableCell>
                        <TableCell>
                          <Badge className={result.success ? 'bg-green-500' : 'bg-red-500'}>
                            {result.success ? 'Success' : 'Failed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-sm truncate">
                          {result.error || result.output || 'No details available'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={deploying}
          >
            {deploymentResults.length > 0 ? 'Close' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleDeployment} 
            disabled={deploying || (!deployAll && selectedFunctions.length === 0)}
          >
            {deploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {deploying ? 'Deploying...' : 'Deploy Functions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 