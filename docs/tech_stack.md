# SpeechFlux - Technology Stack

## Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | Latest | React framework with App Router for server-side rendering |
| React | Latest | UI component library |
| TypeScript | Latest | Type-safe JavaScript |
| Tailwind CSS | Latest | Utility-first CSS framework |
| Radix UI | Latest | Accessible UI primitives |
| Shadcn UI | Latest | Component library built on Radix |
| React Hook Form | Latest | Form handling |
| Zod | Latest | Schema validation |
| React Query | Latest | Data fetching and caching |
| Next Auth | Latest | Authentication integration |

## Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | Latest | Server endpoints |
| Supabase | Latest | Backend-as-a-Service |
| Supabase Edge Functions | Latest | Serverless functions (Deno runtime) |
| Node.js | 20.x LTS | JavaScript runtime |

## Database & Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase PostgreSQL | Latest | Relational database |
| Cloudflare R2 | Latest | Object storage (S3-compatible) |
| Prisma | Latest | Type-safe ORM (optional) |

## AI & External Services

| Technology | Version | Purpose |
|------------|---------|---------|
| OpenAI Whisper API | Latest | Speech-to-text conversion |
| OpenAI GPT-4o-mini API | Latest | Translation and summarization |
| Paddle | Latest | Payment processing and subscriptions |

## DevOps & Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| Vercel | Latest | Hosting and deployment |
| GitHub Actions | Latest | CI/CD pipeline |
| ESLint | Latest | Code linting |
| Prettier | Latest | Code formatting |
| Jest | Latest | Unit and integration testing |
| Cypress | Latest | End-to-end testing |
| Docker | Latest | Containerization (for local development) |

## Monitoring & Analytics

| Technology | Version | Purpose |
|------------|---------|---------|
| Sentry | Latest | Error tracking |
| Vercel Analytics | Latest | Performance monitoring |
| Plausible Analytics | Latest | Privacy-focused web analytics |

## Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| pnpm | Latest | Package manager (faster than npm) |
| Husky | Latest | Git hooks |
| lint-staged | Latest | Pre-commit linting |
| Commitlint | Latest | Commit message linting |
| Turborepo | Latest | Monorepo management (if needed) |

## Environment Setup

Development environment will include:
- `.env` files for environment variables
- VSCode configuration with recommended extensions
- Docker Compose for local development services
- Development/Staging/Production environment configurations 