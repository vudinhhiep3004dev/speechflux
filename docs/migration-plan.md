# Migration Plan for Next.js 15 and React Server Components

## Overview

This document outlines a comprehensive migration strategy to fix the core issues in the SpeechFlux application and make it fully compatible with Next.js 15 and React Server Components. The plan focuses on properly separating client and server code, updating build configurations, and ensuring a smooth authentication experience.

## Core Architectural Changes

### 1. Client vs Server Component Separation

**Problem**: Mixing client-side logic in server components, particularly with authentication.

**Solution**:
- ✅ Mark all files that require browser APIs with `'use client'` directive
- ✅ Move server-only logic to separate files
- ✅ Create proper boundaries between client and server code

### 2. Authentication Flow Updates

**Problem**: AuthProvider is being used in server components and causing hydration errors.

**Solution**:
- ✅ Move all authentication logic to client components
- ✅ Use the Next.js App Router's middleware for authentication checks
- ✅ Implement a clear separation between authenticated and unauthenticated state

### 3. Build and SSR Configuration

**Problem**: Current build configuration is causing conflicts in the build process.

**Solution**:
- ✅ Update next.config.js with appropriate settings for Next.js 15
- ✅ Properly configure static vs dynamic rendering
- ✅ Implement error boundaries to handle auth-related errors

### 4. Performance and Scalability Improvements

**Problem**: Processing large audio files and AI operations causes delays and poor user experience.

**Solution**:
- ✅ Implement Redis for caching frequently accessed data
- ✅ Create job queue system for background processing
- ✅ Utilize Supabase Edge Functions for serverless backend
- ✅ Add webhook support for async processing completion notifications

## Specific Component Migration Steps

### Root Layout (Completed)
- ✅ Converted to client component
- ✅ Created proper client-side authentication wrapper
- ✅ Moved metadata to a separate file

### Authentication Provider (Completed)
- ✅ Ensure it's only used in client components
- ✅ Create middleware-based authentication checks
- ✅ Update protected route handling

### Lexical Editor Components (Completed)
- ✅ Created lexical-shim.ts for compatibility
- ✅ Properly typed utility functions
- ✅ Updated imports in dependent components

### Dashboard Pages (Completed)
- ✅ Apply `'use client'` directive to pages using authentication
- ✅ Add proper error boundaries
- ✅ Update data fetching to use React Server Components patterns

### Redis Integration (Completed)
- ✅ Set up Redis client with Upstash
- ✅ Create caching utilities for common data types
- ✅ Implement job queue for asynchronous processing
- ✅ Add distributed locking mechanism

### Edge Functions Integration (In Progress)
- ✅ Update API routes to use job queues
- ✅ Create webhook endpoint for completion notifications 
- ✅ Develop Edge Function deployment automation
- ✅ Create monitoring and logging systems

## Implementation Schedule

### Phase 1: Core Architecture (Completed)
- ✅ Convert root layout to client component
- ✅ Create metadata provider for server components
- ✅ Update next.config.js for compatibility
- ✅ Create and update lexical-shim.ts

### Phase 2: Authentication Updates (Completed)
- ✅ Update authentication provider
- ✅ Implement middleware for auth checks
- ✅ Create fallback UI for unauthenticated states

### Phase 3: Component Updates (Completed)
- ✅ Update all dashboard pages
- ✅ Fix hydration issues in dynamic components
- ✅ Update error boundaries and not-found pages

### Phase 4: Build Optimization (Completed)
- ✅ Clean up build configuration
- ✅ Optimize bundle size
- ✅ Implement proper caching strategy

### Phase 5: UI Improvements (Completed)
- ✅ Create new Dashboard layout with Sidebar
- ✅ Add mobile responsiveness to Header and Dashboard
- ✅ Implement theme switching with dark/light mode
- ✅ Create Settings page with user profile management
- ✅ Improve navigation with dropdown menus for mobile
- ✅ Add transition animations for improved UX

### Phase 6: Advanced Features (In Progress)
- ✅ Redis integration for caching and job queues
- ✅ Update API routes to use Redis queues
- ✅ Create cache invalidation system
- ✅ Finalize Edge Functions for serverless backend
- ✅ Implement webhook handlers for async processing
- ✅ Develop failover mechanisms for API calls

## Testing Strategy

Each phase should be tested with:

1. Development server (`npm run dev`)
2. Production build locally (`npm run build && npm start`)
3. CI/CD pipeline tests

## Tips for Developers

1. Always add `'use client'` at the top of files that:
   - Use React hooks
   - Manipulate browser API (window, document, localStorage)
   - Use event handlers
   - Need client-side interactivity

2. For data fetching:
   - Use server components where possible
   - Move client-side state to leaf components
   - Use React Query for client-side data fetching

3. For authentication:
   - Avoid checking auth state in server components
   - Use middleware for protected routes
   - Implement proper loading states

4. For caching and performance:
   - Use Redis caching for frequent database queries
   - Implement queue processing for long-running tasks
   - Add cache invalidation for data updates
   - Set appropriate TTLs for different data types

## Known Issues and Solutions

| Issue | Solution |
|-------|----------|
| "ssr: false is not allowed with next/dynamic" | Move dynamic imports to client components or use pattern shown in layout.tsx |
| Hydration errors with authentication | Use the client component pattern with useEffect for mounting |
| Metadata in client components | Use separate metadata files for server components |
| Type errors in build | Fix core type issues, particularly in Lexical components |
| Redis connection issues | Ensure proper environment variables are set, implement fallback mechanism | 