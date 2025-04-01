/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output mode for better deployment compatibility
  output: 'standalone',
  
  // React strict mode helps identify problems
  reactStrictMode: true,
  
  // Optimizations for better app performance
  swcMinify: true,
  
  // Turn off experimental features that might cause issues
  experimental: {
    // Disable features that can cause hydration issues
    isrFlushToDisk: false,
    optimizeCss: false,
    serverActions: true,
    serverActionsBodySizeLimit: '2mb',
  },
  
  // Disable image optimization to speed up build
  images: {
    unoptimized: true,
    domains: [
      'fijovkhgxbhypwgkqkty.supabase.co',
    ],
  },
  
  // Environment variables exposed to client
  env: {
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
  },
  
  // Disable TypeScript type checking during build for now
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during build for now
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Additional webpack configuration
  webpack: (config, { isServer }) => {
    // Add any webpack modifications here if needed
    return config;
  },
};

module.exports = nextConfig; 