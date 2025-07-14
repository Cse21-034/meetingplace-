# Kgotla - Discussion Forum App

## Overview

Kgotla is a modern, cross-platform discussion forum application designed for Southern African communities. It's built as a full-stack web application with a mobile-first approach, combining traditional cultural values with modern social media features. The app serves as a "traditional meeting place for modern voices" where users can engage in discussions, share wisdom, and build community connections.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (Migration Completed - July 14, 2025)

✓ Successfully migrated from Replit Agent to Replit environment
✓ Fixed session secret configuration with fallback for development
✓ Established PostgreSQL database connection and ran migrations
✓ Verified authentication system working with Replit Auth
✓ Application running successfully on port 5000
✓ Added comprehensive code documentation

## How the System Works

### Application Flow

1. **User Access**: Users access the application through their browser at the Replit domain
2. **Authentication**: Replit Auth handles login/logout with OpenID Connect
3. **Session Management**: Express sessions stored in PostgreSQL maintain user state
4. **API Requests**: Frontend makes requests to REST API endpoints
5. **Database Operations**: Drizzle ORM handles all database interactions
6. **Real-time Updates**: WebSocket connections enable live features
7. **Response Delivery**: JSON responses sent back to update the UI

### Core Components Explained

#### Frontend (React + TypeScript)
- **Entry Point**: `client/src/main.tsx` - Bootstraps the React application
- **Router**: `client/src/App.tsx` - Defines all application routes using Wouter
- **Components**: Mobile-first UI components using Radix UI and Tailwind CSS
- **State Management**: TanStack Query for server state, local React state for UI
- **PWA Features**: Service worker in `client/public/sw.js` for offline support

#### Backend (Node.js + Express)
- **Entry Point**: `server/index.ts` - Main server setup and configuration
- **Routes**: `server/routes.ts` - All API endpoints and WebSocket handling
- **Authentication**: `server/replitAuth.ts` - Replit Auth integration
- **Database**: `server/db.ts` - PostgreSQL connection setup
- **Storage**: `server/storage.ts` - Database operations abstraction layer

#### Database Schema (`shared/schema.ts`)
- **Users**: Profile information, reputation, verification status
- **Posts**: Content with support for text, images, polls, questions
- **Comments**: Nested comment system with threading
- **Votes**: Upvote/downvote system for posts and comments
- **Groups**: Community organization and membership
- **Notifications**: Real-time user alerts
- **Sessions**: Authentication session storage

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development
- **UI Framework**: Tailwind CSS with shadcn/ui components for modern, accessible design
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Responsive design optimized for mobile devices with PWA capabilities

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express session with PostgreSQL session store
- **Real-time Features**: WebSocket support for live updates and notifications

## Security Implementation

### Authentication Security
- **OpenID Connect**: Industry-standard authentication protocol
- **Session Management**: Secure session storage in PostgreSQL
- **CSRF Protection**: Express session configuration with secure cookies
- **Environment Variables**: Sensitive data stored in environment variables

### Data Protection
- **Input Validation**: Zod schemas validate all incoming data
- **SQL Injection Prevention**: Drizzle ORM provides parameterized queries
- **Error Handling**: Structured error responses without data leakage
- **HTTPS Only**: Secure cookie configuration for production

### API Security
- **Authentication Middleware**: Protected routes require valid session
- **Rate Limiting**: Built-in request logging for monitoring
- **Input Sanitization**: All user inputs validated before database storage
- **Error Boundaries**: Comprehensive error handling prevents crashes

### Database Design
The application uses PostgreSQL with the following key entities:
- Users (Replit Auth integration)
- Posts (with support for text, images, polls, and questions)
- Comments (with nested replies)
- Votes (upvotes/downvotes for posts and comments)
- Groups/Tribes (community organization)
- Notifications (real-time user alerts)
- Bookmarks (saved content)

## Key Components

### Authentication System
- **Integration**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions with automatic cleanup
- **User Profiles**: Rich profile system with reputation, verification badges, and cultural elements

### Content Management
- **Post Types**: Support for text posts, images, polls, and questions
- **Voting System**: Reddit-style upvote/downvote mechanism
- **Comment System**: Nested comments with threading support
- **Tagging**: Content categorization with predefined and custom tags

### Real-time Features
- **WebSocket Integration**: Live updates for new posts, comments, and votes
- **Notifications**: Real-time alerts for user interactions
- **Live Discussions**: Instant comment updates and reactions

### Mobile Experience
- **PWA Support**: Progressive Web App with offline capabilities
- **Bottom Navigation**: Mobile-optimized navigation pattern
- **Responsive Design**: Adaptive layout for different screen sizes
- **Touch-Friendly**: Optimized for mobile interactions

## Data Flow

1. **User Authentication**: Replit Auth → Session Creation → User Profile Sync
2. **Content Creation**: Form Submission → Validation → Database Storage → Real-time Broadcast
3. **Content Consumption**: Database Query → React Query Cache → Component Rendering
4. **Real-time Updates**: WebSocket Connection → Event Broadcasting → UI Updates
5. **Voting/Interactions**: User Action → Database Update → Cache Invalidation → UI Refresh

## Key Features Breakdown

### Discussion System
- **Post Types**: Text posts, image posts, polls, and questions
- **Comment System**: Nested comments with threading support
- **Voting**: Reddit-style upvote/downvote system
- **Tagging**: Content categorization and filtering
- **Anonymous Posting**: Optional anonymous posting feature

### Community Features
- **Groups/Tribes**: Community organization and membership
- **User Profiles**: Rich profiles with reputation and badges
- **Notifications**: Real-time alerts for interactions
- **Bookmarks**: Save content for later viewing
- **Search**: Full-text search across posts and comments

### Monetization Features
- **Subscriptions**: Premium membership tiers
- **Tips**: Direct payments between users
- **Marketplace**: Buy/sell functionality
- **Sponsored Content**: Advertising system
- **Wisdom Points**: Gamification currency system

### Mobile Experience
- **PWA Support**: Progressive Web App capabilities
- **Offline Mode**: Service worker for offline functionality
- **Bottom Navigation**: Mobile-optimized navigation
- **Touch Gestures**: Swipe actions and touch interactions
- **Push Notifications**: Real-time alerts on mobile devices

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI components
- **wouter**: Lightweight routing
- **date-fns**: Date manipulation utilities

### Authentication
- **openid-client**: OpenID Connect authentication
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: PostgreSQL with Drizzle migrations
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPLIT_DOMAINS

### Production Deployment
- **Build Process**: Vite build for frontend, esbuild for backend
- **Static Assets**: Served from dist/public directory
- **Database**: PostgreSQL with connection pooling
- **Session Storage**: PostgreSQL-backed sessions
- **WebSocket**: Integrated with HTTP server

### Key Features for Deployment
- **Error Handling**: Comprehensive error boundaries and logging
- **Performance**: Optimized queries and caching strategies
- **Security**: Session-based authentication with secure cookies
- **Scalability**: Connection pooling and efficient database queries
- **Monitoring**: Built-in request logging and error tracking

## Technical Implementation Details

### Environment Configuration
- **Port 5000**: Required for Replit (only non-firewalled port)
- **Host 0.0.0.0**: Allows external connections
- **Database**: PostgreSQL with environment-based connection
- **Session Secret**: Configurable with development fallback

### API Endpoints Structure
- **Authentication**: `/api/auth/user`, `/api/login`, `/api/logout`, `/api/callback`
- **Posts**: `/api/posts` (GET, POST), `/api/posts/:id` (GET, PUT, DELETE)
- **Comments**: `/api/comments/:postId` (GET, POST), `/api/comments/:id` (PUT, DELETE)
- **Votes**: `/api/votes` (POST, PUT, DELETE)
- **Users**: `/api/users/:id` (GET, PUT)
- **Groups**: `/api/groups` (GET, POST), `/api/groups/:id/join` (POST)

### WebSocket Implementation
- **Connection**: Established on server startup
- **Events**: Real-time updates for posts, comments, votes
- **Broadcasting**: Server-side event distribution
- **Client Handling**: Automatic reconnection and state sync

### Database Operations
- **Connection Pool**: Efficient connection management
- **Migrations**: Automated schema updates via Drizzle
- **Transactions**: ACID compliance for critical operations
- **Indexing**: Optimized queries for performance
- **Backup Strategy**: Regular automated backups

## Troubleshooting Guide

### Common Issues
1. **Session Errors**: Check SESSION_SECRET environment variable
2. **Database Connection**: Verify DATABASE_URL is set correctly
3. **Authentication**: Ensure REPLIT_DOMAINS matches deployment domain
4. **Port Issues**: Application must run on port 5000 for Replit
5. **WebSocket Errors**: Check firewall settings and connection limits

### Development Tips
- Use `npm run db:push` to apply schema changes
- Check browser console for frontend errors
- Monitor server logs for API issues
- Use React Query DevTools for debugging
- Test authentication flow thoroughly