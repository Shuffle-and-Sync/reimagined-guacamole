# Shuffle & Sync - TCG Streaming Coordination Platform

## Overview

Shuffle & Sync is a comprehensive streaming coordination platform designed for trading card game (TCG) communities. The application enables streamers and content creators to connect, coordinate collaborative streams, and build community around popular card games like Magic: The Gathering, Pokemon, Lorcana, Yu-Gi-Oh, and others. The platform features community-based organization, user authentication, real-time coordination tools, and a modern responsive interface built for both creators and viewers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessibility and customization
- **Styling**: Tailwind CSS with custom design tokens and dark theme support
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: Modular component architecture with reusable UI components in `/components/ui/`

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route handlers
- **Middleware**: Custom logging, JSON parsing, and error handling middleware
- **Development Setup**: Hot reload with tsx for development, esbuild for production builds

### Authentication System
- **Provider**: Replit Authentication (OpenID Connect)
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Security**: HTTP-only cookies, CSRF protection, secure session configuration
- **User Management**: Automatic user creation/updates on authentication with profile data sync

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless for scalability
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Design**: 
  - Users table with profile information and community preferences
  - Communities table for the 6 TCG communities (MTG, Pokemon, Lorcana, Yu-Gi-Oh, etc.)
  - User-community relationships with primary community selection
  - Theme preferences for personalized UI customization
  - Session storage for authentication state

### External Dependencies
- **Database Hosting**: Neon Serverless PostgreSQL for managed database infrastructure
- **Authentication**: Replit OAuth/OIDC for user authentication and profile management
- **UI Icons**: Font Awesome for consistent iconography across the platform
- **Fonts**: Google Fonts (Inter, DM Sans, Architects Daughter, Fira Code, Geist Mono) for typography
- **Development Tools**: Replit-specific plugins for development environment integration

### Design Patterns
- **Separation of Concerns**: Clear separation between client, server, and shared code
- **Repository Pattern**: Database operations abstracted through storage interface
- **Component Composition**: Reusable UI components with consistent prop interfaces
- **Type Safety**: Full TypeScript coverage with shared types between frontend and backend
- **Environment Configuration**: Environment-based configuration for database and authentication
- **Error Boundaries**: Comprehensive error handling with user-friendly error states