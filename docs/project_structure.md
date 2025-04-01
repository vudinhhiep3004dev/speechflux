# SpeechFlux - Project Structure

Based on Next.js App Router architecture, the project will be organized as follows:

```
/
├── .github/                      # GitHub Actions workflows
├── .husky/                       # Git hooks
├── app/                          # Next.js App Router components
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/                # Login page
│   │   ├── register/             # Register page
│   │   └── reset-password/       # Password reset
│   ├── (dashboard)/              # Dashboard routes (authenticated)
│   │   ├── dashboard/            # Main dashboard
│   │   ├── upload/               # File upload
│   │   ├── files/                # File management
│   │   │   └── [id]/             # Individual file view/edit
│   │   ├── settings/             # User settings
│   │   └── billing/              # Subscription management
│   ├── (marketing)/              # Public marketing pages
│   │   ├── pricing/              # Pricing page
│   │   ├── features/             # Features showcase
│   │   └── about/                # About page
│   ├── api/                      # API routes
│   │   ├── auth/                 # Auth endpoints
│   │   ├── files/                # File management
│   │   ├── transcripts/          # Transcript operations
│   │   ├── translations/         # Translation operations
│   │   ├── summaries/            # Summary operations
│   │   └── webhooks/             # Webhook handlers
│   ├── error.tsx                 # Error boundary
│   ├── layout.tsx                # Root layout
│   ├── loading.tsx               # Loading state
│   ├── not-found.tsx             # 404 page
│   └── page.tsx                  # Landing page
├── components/                   # Reusable components
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard components
│   ├── editor/                   # Transcript editor components
│   ├── file/                     # File handling components
│   ├── layout/                   # Layout components
│   ├── marketing/                # Marketing page components
│   ├── ui/                       # UI components (shadcn/ui)
│   └── [other component categories]
├── config/                       # Configuration files
│   ├── site.ts                   # Site configuration
│   └── dashboard.ts              # Dashboard configuration
├── db/                           # Database utilities
│   ├── schema.ts                 # Database schema types
│   └── queries/                  # Database queries
├── hooks/                        # Custom React hooks
├── lib/                          # Utility functions
│   ├── api/                      # API client utilities
│   ├── auth/                     # Auth utilities
│   ├── storage/                  # Storage utilities
│   ├── ai/                       # AI service utilities
│   │   ├── whisper.ts            # OpenAI Whisper integration
│   │   └── gpt.ts                # OpenAI GPT integration
│   ├── paddle/                   # Payment integration
│   └── utils/                    # General utilities
├── middleware.ts                 # Next.js middleware
├── providers/                    # React context providers
│   ├── auth-provider.tsx         # Authentication provider
│   └── theme-provider.tsx        # Theme provider
├── public/                       # Static assets
│   ├── fonts/                    # Web fonts
│   ├── images/                   # Images
│   └── favicon.ico               # Favicon
├── styles/                       # Global styles
│   └── globals.css               # Global CSS
├── types/                        # TypeScript type definitions
├── edge-functions/               # Supabase Edge Functions
│   ├── whisper-transcribe/       # Transcription function
│   ├── translate-text/           # Translation function
│   └── summarize-text/           # Summarization function
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
├── .env.example                  # Example environment variables
├── .eslintrc.js                  # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── jest.config.js                # Jest configuration
├── next.config.js                # Next.js configuration
├── package.json                  # Project dependencies
├── postcss.config.js             # PostCSS configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## Key Architecture Principles

1. **Route Groups**: App Router route groups (in parentheses) separate pages by functionality
2. **Component Organization**: Components categorized by feature and reusability
3. **API Routes**: API endpoints organized by resource/functionality
4. **Edge Functions**: Serverless functions for compute-intensive tasks
5. **Type Safety**: TypeScript used throughout the codebase
6. **Testing**: Unit, integration, and E2E testing structure 