'use server';

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Edge function deployment configuration
interface DeploymentConfig {
  functionName: string;
  sourceDir: string;
  importMap?: Record<string, string>;
  env?: Record<string, string>;
}

/**
 * Deploy edge functions to Supabase
 * @param configs Array of deployment configurations
 * @returns Results of deployments
 */
export async function deployEdgeFunctions(configs: DeploymentConfig[]) {
  // Create a Supabase client with admin credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  const results = [];
  
  for (const config of configs) {
    try {
      // Check if the function exists
      const { data: functionExists, error: checkError } = await supabase
        .from('edge_functions')
        .select('id')
        .eq('name', config.functionName)
        .single();
      
      // Create function map for deployment
      let importMap = config.importMap || {};
      
      // Default import mapping for common libraries
      const defaultImports = {
        '@supabase/supabase-js': 'https://esm.sh/@supabase/supabase-js@2.31.0',
        'openai': 'https://esm.sh/openai@4.4.0'
      };
      
      importMap = { ...defaultImports, ...importMap };
      
      // Create temporary import map file
      const importMapPath = path.join(config.sourceDir, 'import_map.json');
      fs.writeFileSync(
        importMapPath,
        JSON.stringify({ imports: importMap }, null, 2)
      );
      
      // Create .env file if environment variables are provided
      if (config.env) {
        const envPath = path.join(config.sourceDir, '.env');
        const envContent = Object.entries(config.env)
          .map(([key, value]) => `${key}="${value}"`)
          .join('\n');
        
        fs.writeFileSync(envPath, envContent);
      }
      
      // Build command for deployment
      const command = `supabase functions deploy ${config.functionName} --project-ref "${supabaseUrl.split('//')[1].split('.')[0]}" --import-map "${importMapPath}"`;
      
      // Execute deployment command
      const { stdout, stderr } = await execAsync(command);
      
      // Clean up temporary files
      if (fs.existsSync(importMapPath)) {
        fs.unlinkSync(importMapPath);
      }
      
      const envPath = path.join(config.sourceDir, '.env');
      if (fs.existsSync(envPath)) {
        fs.unlinkSync(envPath);
      }
      
      results.push({
        functionName: config.functionName,
        success: !stderr,
        output: stdout,
        error: stderr || null
      });
    } catch (error) {
      results.push({
        functionName: config.functionName,
        success: false,
        output: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
}

/**
 * Test deployed edge function
 * @param functionName Name of the deployed function
 * @param payload Test payload
 * @returns Test result
 */
export async function testEdgeFunction(
  functionName: string,
  payload: any
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });
    
    if (error) {
      return {
        success: false,
        function: functionName,
        error: error.message,
        data: null
      };
    }
    
    return {
      success: true,
      function: functionName,
      data
    };
  } catch (error) {
    return {
      success: false,
      function: functionName,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

/**
 * Get deployment status for all edge functions
 * @returns List of deployed functions and their status
 */
export async function getEdgeFunctionStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  try {
    // Get list of deployed functions
    const { data: functions, error } = await supabase
      .from('edge_functions')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    return functions.map(fn => ({
      name: fn.name,
      status: fn.status,
      version: fn.version,
      createdAt: fn.created_at,
      updatedAt: fn.updated_at
    }));
  } catch (error) {
    console.error('Error fetching edge function status:', error);
    return [];
  }
}

/**
 * Deploy all edge functions from the edge-functions directory
 * @returns Deployment results
 */
export async function deployAllEdgeFunctions() {
  const edgeFunctionsDir = path.join(process.cwd(), 'edge-functions');
  
  // Check if the directory exists
  if (!fs.existsSync(edgeFunctionsDir)) {
    throw new Error('Edge functions directory not found');
  }
  
  // Get all subdirectories (each is an edge function)
  const functionDirs = fs.readdirSync(edgeFunctionsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  const deploymentConfigs: DeploymentConfig[] = functionDirs.map(functionName => ({
    functionName,
    sourceDir: path.join(edgeFunctionsDir, functionName),
    // Load environment variables from .env.edge file if it exists
    env: loadEnvFile(path.join(edgeFunctionsDir, functionName, '.env.edge'))
  }));
  
  return deployEdgeFunctions(deploymentConfigs);
}

/**
 * Load environment variables from a file
 * @param filePath Path to the .env file
 * @returns Object with environment variables
 */
function loadEnvFile(filePath: string): Record<string, string> | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env: Record<string, string> = {};
  
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)="([^"]*)"$/);
    if (match) {
      const [, key, value] = match;
      env[key.trim()] = value;
    }
  });
  
  return env;
} 