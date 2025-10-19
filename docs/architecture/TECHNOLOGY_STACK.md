# Technology Stack - Shuffle & Sync

## Overview

Shuffle & Sync is built with modern, production-ready technologies focusing on type safety, developer experience, and scalability. This document provides a comprehensive overview of all technologies used in the project.

## Frontend Architecture

### Core Framework

#### React 18

- **Version**: 18.3.1
- **Purpose**: UI framework for building the client application
- **Features Used**:
  - Functional components with hooks
  - Concurrent rendering
  - Automatic batching
  - Suspense for data fetching
- **Why React**: Mature ecosystem, strong TypeScript support, excellent developer tools

#### TypeScript

- **Version**: 5.6.3
- **Purpose**: Type-safe JavaScript superset
- **Configuration**: Strict mode enabled
- **Features Used**:
  - Strong typing for components and functions
  - Interface definitions for data structures
  - Generic types for reusable components
  - Type inference for reduced boilerplate
- **Why TypeScript**: Catch errors at compile time, better IDE support, improved maintainability

### Build Tool

#### Vite

- **Version**: 7.1.7
- **Purpose**: Fast development server and build tool
- **Features Used**:
  - Lightning-fast HMR (Hot Module Replacement)
  - Optimized production builds
  - Native ES modules support
  - Plugin ecosystem
- **Why Vite**: Significantly faster than Webpack, excellent developer experience, modern architecture

### UI Library & Components

#### Shadcn/ui

- **Purpose**: Accessible component library built on Radix UI
- **Components Used**:
  - Buttons, Cards, Dialogs, Dropdowns
  - Forms, Inputs, Modals, Tooltips
  - Navigation, Tabs, Toast notifications
  - Data tables, Calendars, Accordions
- **Why Shadcn/ui**: Copy-paste components, full customization, accessibility built-in

#### Radix UI

- **Purpose**: Low-level UI primitive components
- **Components Used**:
  - Dialog, Popover, Tooltip primitives
  - Dropdown Menu, Select, Tabs
  - Accordion, Collapsible, Separator
  - Alert Dialog, Context Menu, Hover Card
- **Why Radix UI**: Unstyled, accessible, composable primitives

#### Lucide React

- **Version**: 0.453.0
- **Purpose**: Icon library
- **Features Used**:
  - 1000+ consistent icons
  - Tree-shakeable imports
  - Customizable size and color
- **Why Lucide**: Clean design, small bundle size, actively maintained

### Styling

#### Tailwind CSS

- **Version**: 3.4.17
- **Purpose**: Utility-first CSS framework
- **Features Used**:
  - Utility classes for rapid development
  - Custom design tokens
  - Dark mode support
  - Responsive design utilities
  - Custom plugins for animations
- **Plugins**:
  - `@tailwindcss/typography`: Rich text styling
  - `tailwindcss-animate`: Animation utilities
- **Why Tailwind**: Fast development, consistent design, small production bundle

#### PostCSS

- **Version**: 8.5.6
- **Purpose**: CSS processing tool
- **Plugins Used**:
  - Autoprefixer for vendor prefixes
- **Why PostCSS**: Industry standard, excellent Tailwind integration

### State Management

#### TanStack React Query

- **Version**: 5.87.1
- **Purpose**: Server state management
- **Features Used**:
  - Data fetching and caching
  - Automatic background refetching
  - Optimistic updates
  - Mutation management
  - Pagination and infinite scroll
- **Why React Query**: Eliminates boilerplate, powerful caching, excellent DevTools

#### Zustand

- **Version**: 5.0.8
- **Purpose**: Client-side state management
- **Features Used**:
  - Simple, unopinionated API
  - No boilerplate
  - TypeScript support
  - Middleware for persistence
- **Why Zustand**: Minimal API, small bundle size, easy to learn

### Routing

#### Wouter

- **Version**: 3.7.1
- **Purpose**: Lightweight client-side routing
- **Features Used**:
  - Hook-based routing
  - Path parameters
  - Query strings
  - Navigation guards
- **Why Wouter**: Tiny bundle size (1.5KB), simple API, React Router alternative

### Forms & Validation

#### React Hook Form

- **Version**: 7.62.0
- **Purpose**: Form state management
- **Features Used**:
  - Uncontrolled components
  - Built-in validation
  - Error handling
  - Field arrays
- **Why React Hook Form**: Excellent performance, minimal re-renders, great DevTools

#### Zod

- **Version**: 3.25.76
- **Purpose**: Schema validation library
- **Features Used**:
  - Type-safe schema definitions
  - Runtime validation
  - Error messages
  - Schema composition
- **Integration**: Used with React Hook Form via `@hookform/resolvers`
- **Why Zod**: TypeScript-first, excellent error messages, runtime safety

### Additional Frontend Libraries

#### Date & Time

- **date-fns**: 3.6.0 - Date manipulation and formatting
- **react-day-picker**: 8.10.1 - Calendar/date picker component

#### Animation

- **framer-motion**: 11.18.2 - Animation library for React
- **@dnd-kit/core**: 6.3.1 - Drag and drop toolkit
- **@dnd-kit/sortable**: 10.0.0 - Sortable lists

#### UI Utilities

- **class-variance-authority**: 0.7.1 - Component variant management
- **clsx**: 2.1.1 - Conditional className utility
- **tailwind-merge**: 2.6.0 - Merge Tailwind classes intelligently
- **cmdk**: 1.1.1 - Command menu component
- **vaul**: 1.1.2 - Drawer component
- **embla-carousel-react**: 8.6.0 - Carousel component
- **recharts**: 2.15.2 - Charting library
- **react-resizable-panels**: 2.1.7 - Resizable panel layouts

## Backend Architecture

### Core Framework

#### Node.js

- **Version**: 18+
- **Purpose**: JavaScript runtime for server-side code
- **Features Used**:
  - ES modules (ESM)
  - Native fetch API
  - Worker threads for parallel processing
- **Why Node.js**: JavaScript everywhere, huge ecosystem, excellent performance

#### Express.js

- **Version**: 4.21.2
- **Purpose**: Web application framework
- **Features Used**:
  - Routing and middleware
  - Request/response handling
  - Static file serving
  - Error handling
- **Why Express**: Battle-tested, minimal overhead, extensive middleware ecosystem

#### TypeScript (Server)

- **Version**: 5.6.3
- **Purpose**: Type-safe server-side code
- **Configuration**:
  - ES modules
  - Strict mode
  - Path aliases for clean imports
- **Execution**: tsx for development, compiled JavaScript for production

### Authentication

#### Auth.js (NextAuth.js v5)

- **Version**: @auth/core 0.40.0, @auth/express 0.11.0
- **Purpose**: Authentication framework
- **Features Used**:
  - Google OAuth 2.0 integration
  - Session management
  - JWT tokens
  - Database adapter integration
- **Adapter**: @auth/drizzle-adapter 1.10.0 for database sessions
- **Why Auth.js**: Comprehensive auth solution, OAuth support, secure by default

#### Google OAuth 2.0

- **Purpose**: User authentication via Google accounts
- **Configuration**: Google Cloud Console OAuth credentials
- **Scopes**: Email, profile
- **Why Google OAuth**: Trusted provider, easy user onboarding, secure

### Database

#### SQLite Cloud

- **Driver**: @sqlitecloud/drivers 1.0.507
- **Purpose**: Cloud-hosted SQLite database
- **Features Used**:
  - Serverless architecture
  - Global distribution
  - Automatic scaling
  - SQLite syntax compatibility
- **Why SQLite Cloud**: Simple setup, cost-effective, reliable

#### Drizzle ORM

- **Version**: 0.44.6
- **Purpose**: Type-safe database ORM
- **Features Used**:
  - Schema definition and validation
  - Type-safe queries
  - Migrations
  - Transactions
  - Relations
- **Why Drizzle**: Excellent TypeScript support, lightweight, modern API

#### Drizzle Kit

- **Version**: 0.31.5
- **Purpose**: Database migration and management tool
- **Features Used**:
  - Schema synchronization (`drizzle-kit push`)
  - Migration generation
  - Schema introspection
- **Why Drizzle Kit**: Seamless integration with Drizzle ORM

### Security & Middleware

#### Rate Limiting

- **express-rate-limit**: 8.0.1
- **Purpose**: API rate limiting
- **Configuration**: Per-endpoint limits
- **Why**: Prevent abuse, protect against DDoS

#### Session Management

- **express-session**: 1.18.2
- **memorystore**: 1.6.7
- **Purpose**: Session storage middleware
- **Strategy**: Database sessions via Auth.js
- **Why**: Secure session handling, multi-instance support

#### Password Hashing

- **@node-rs/argon2**: 2.0.2
- **Purpose**: Secure password hashing (for future password auth)
- **Why Argon2**: Winner of password hashing competition, secure against attacks

### Email Service

#### SendGrid

- **Version**: @sendgrid/mail 8.1.6
- **Purpose**: Transactional email delivery
- **Features Used**:
  - Welcome emails
  - Password reset emails
  - Notification emails
- **Why SendGrid**: Reliable delivery, simple API, good free tier

### Real-time Communication

#### WebSocket (ws)

- **Version**: 8.18.0
- **Purpose**: Real-time bidirectional communication
- **Features Used**:
  - Live messaging
  - Game state synchronization
  - Stream status updates
- **Why ws**: Native WebSocket implementation, excellent performance

### Utilities

#### Data Validation

- **zod**: 3.25.76 - Schema validation (shared with frontend)
- **zod-validation-error**: 3.4.0 - Friendly error messages

#### Unique IDs

- **nanoid**: 5.0.9 - Cryptographically strong unique ID generator

#### Environment Variables

- **dotenv**: 16.4.7 - Load environment variables from .env files

#### Caching

- **memoizee**: 0.4.17 - Function result memoization

#### Data Parsing

- **papaparse**: 5.5.3 - CSV parsing for card data imports

## Development Tools

### TypeScript Tooling

#### tsx

- **Version**: 4.20.5
- **Purpose**: TypeScript execution for Node.js
- **Usage**: Development server, scripts
- **Why tsx**: Fast, ESM support, no compilation step needed

### Testing

#### Jest

- **Version**: 30.1.3
- **Purpose**: Testing framework
- **Features Used**:
  - Unit tests
  - Integration tests
  - Coverage reporting
  - Mocking
- **Configuration**: ts-jest for TypeScript support
- **Why Jest**: Comprehensive, fast, great mocking

#### ts-jest

- **Version**: 29.4.4
- **Purpose**: TypeScript preprocessor for Jest
- **Why**: Native TypeScript testing support

### Build Tools

#### esbuild

- **Version**: 0.25.9
- **Purpose**: Backend bundling
- **Features Used**:
  - Extremely fast compilation
  - ES modules output
  - Tree shaking
  - Minification
- **Why esbuild**: Fastest bundler available, simple configuration

#### Custom Build Script

- **File**: build.js
- **Purpose**: Orchestrates Vite and esbuild builds
- **Features**:
  - Client build (Vite)
  - Server build (esbuild)
  - Asset copying
  - Build verification

### Code Quality

#### ESLint

- **Purpose**: JavaScript/TypeScript linting
- **Configuration**: TypeScript ESLint recommended
- **Rules**: Strict mode with auto-fix enabled
- **Why ESLint**: Industry standard, extensive rules, auto-fix capabilities

#### Prettier

- **Purpose**: Code formatting
- **Configuration**: Consistent formatting across team
- **Integration**: ESLint integration for conflict resolution
- **Why Prettier**: Opinionated formatting, zero config, fast

### Version Control

#### Git

- **Purpose**: Source code version control
- **Branching Strategy**: Feature branches with PR workflow
- **Pre-commit Hooks**: Linting and type checking

## Deployment & Infrastructure

### Cloud Platform

#### Google Cloud Platform (GCP)

- **Services Used**:
  - Cloud Run: Container-based application hosting
  - Secret Manager: Environment variable management
  - Cloud Storage: Static asset storage
  - Cloud Build: CI/CD pipelines
- **Why GCP**: Serverless architecture, auto-scaling, managed services

#### Docker

- **Purpose**: Container-based deployment
- **Files**:
  - Dockerfile: Backend + frontend container
  - Dockerfile.frontend: Frontend-only container
  - docker-compose.production-test.yml: Local production testing
- **Why Docker**: Consistent environments, easy deployment, portable

### CI/CD

#### Cloud Build

- **Files**:
  - cloudbuild.yaml: Backend deployment
  - cloudbuild-frontend.yaml: Frontend deployment
- **Purpose**: Automated build and deployment pipelines
- **Triggers**: Git push to main branch
- **Why Cloud Build**: Native GCP integration, simple YAML configuration

## Development Dependencies

### Type Definitions

- `@types/node`: Node.js type definitions
- `@types/react`: React type definitions
- `@types/react-dom`: React DOM type definitions
- `@types/express`: Express.js type definitions
- `@types/jest`: Jest type definitions
- `@types/ws`: WebSocket type definitions

### Vite Plugins

- `@vitejs/plugin-react`: React support for Vite
- `@replit/vite-plugin-cartographer`: Code mapping (Replit specific)
- `@replit/vite-plugin-runtime-error-modal`: Error display (Replit specific)

### Tailwind Plugins

- `@tailwindcss/typography`: Typography utilities
- `@tailwindcss/vite`: Vite integration

### Optional Dependencies

- `bufferutil`: WebSocket performance optimization

## Package Management

### npm

- **Version**: 10+
- **Strategy**: `--legacy-peer-deps` for dependency resolution
- **Lock File**: package-lock.json committed to repository
- **Scripts**: Comprehensive npm scripts for all tasks

## Technology Selection Criteria

### Why These Technologies?

1. **Type Safety**: TypeScript throughout for catching errors early
2. **Developer Experience**: Fast tools (Vite, esbuild) for quick iteration
3. **Performance**: Lightweight libraries, optimized builds, efficient runtime
4. **Scalability**: Serverless architecture, auto-scaling database
5. **Security**: Auth.js for authentication, Drizzle for SQL injection prevention
6. **Maintainability**: Clear patterns, good documentation, active communities
7. **Cost**: Open-source tools, free tiers for services
8. **Future-proof**: Modern standards, active development, large ecosystems

## Version Management

### Update Strategy

- **Major Updates**: Reviewed and tested before adoption
- **Minor/Patch Updates**: Regular updates for security and features
- **Security Updates**: Immediate application when available
- **Deprecation**: Monitor and plan migrations for deprecated packages

### Compatibility

- **Node.js**: 18+ (LTS versions)
- **npm**: 10+
- **Browsers**: Modern browsers (Chrome, Firefox, Safari, Edge) - last 2 versions
- **TypeScript**: 5.6+

## Future Technology Considerations

### Potential Additions

- **Redis**: For advanced caching and session storage at scale
- **GraphQL**: Alternative API layer for complex queries
- **React Native**: Mobile app development using shared logic
- **tRPC**: Type-safe API alternative to REST
- **Turborepo**: Monorepo management if project expands

### Migration Paths

- **Database**: SQLite Cloud is current choice; could migrate to PostgreSQL if needed
- **State Management**: React Query + Zustand is sufficient; could add Redux if needed
- **Styling**: Tailwind is optimal; Shadcn/ui provides flexibility

## References

- [Project Architecture](./PROJECT_ARCHITECTURE.md)
- [Database Architecture](./DATABASE_ARCHITECTURE.md)
- [Coding Patterns](../development/CODING_PATTERNS.md)
- [Development Guide](../development/DEVELOPMENT_GUIDE.md)

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Technology Stack**: Production-Ready
