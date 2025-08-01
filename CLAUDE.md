# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Full Stack Development
```bash
# Start both frontend and backend concurrently
npm run dev

# Install all dependencies (frontend + backend)
npm run install:all
```

### Frontend Development
```bash
cd frontend
npm start          # Development server with HTTPS
npm run build      # Production build
npm run lint       # Run ESLint
npm test           # Run tests (when implemented)
```

### Backend Development
```bash
cd backend
npm run dev        # Development with nodemon
npm run build      # Compile TypeScript
npm run lint       # Run ESLint
npm test           # Run tests (when implemented)
```

## Architecture Overview

This is a full-stack Meta (Facebook) Ads bulk uploader application with:

### Frontend (React + TypeScript)
- **UI Framework**: React 18 with shadcn/ui components and Tailwind CSS
- **State Management**: React Query for server state, React Hook Form for forms
- **Validation**: Zod schemas matching backend Joi validation
- **Key Files**:
  - `src/App.tsx` - Main application router
  - `src/pages/` - Page components
  - `src/components/` - Reusable UI components
  - `src/lib/api.ts` - API client with axios
  - `src/lib/supabase.ts` - Supabase client setup

### Backend (Express + TypeScript)
- **API Structure**: RESTful with `/api/v1` prefix
- **Service Pattern**: Controllers → Services → External APIs
- **Facebook Integration**: Singleton FacebookService manages all Meta API calls
- **Key Files**:
  - `src/app.ts` - Express app configuration
  - `src/routes/` - API route definitions
  - `src/controllers/` - Request handlers
  - `src/services/FacebookService.ts` - Core Meta API integration
  - `src/middleware/` - Auth, validation, error handling

### Database & Real-time
- **Supabase** for PostgreSQL database and real-time subscriptions
- Tables: users, accounts, campaigns, ad_sets, ads, templates, jobs
- Real-time updates for ad creation progress

### Facebook API Integration
The app implements a comprehensive Meta Marketing API integration:
- OAuth flow for user authentication
- Campaign, Ad Set, and Ad creation
- Advanced targeting (demographics, interests, behaviors)
- Multiple bid strategies (LOWEST_COST, LOWEST_COST_WITH_BID_CAP, etc.)
- Bulk ad creation with different images/videos
- Template system for reusable configurations

## Key Implementation Details

### API Endpoints
- `POST /api/v1/facebook/bulk-create-ads` - Main bulk ad creation
- `GET /api/v1/facebook/campaigns` - List user campaigns
- `POST /api/v1/facebook/test-ad` - Test ad creation
- `POST /api/v1/upload` - Media file upload

### Environment Variables
Required in `.env` files:
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `DATABASE_URL`
- `SESSION_SECRET`

### File Structure Patterns
- Frontend uses path aliases: `@/components`, `@/lib`, etc.
- Backend uses relative imports
- Shared types should match between frontend Zod schemas and backend Joi schemas

### Testing Strategy
- Frontend: Jest + React Testing Library (setup complete, tests pending)
- Backend: Jest with ts-jest (setup complete, tests pending)
- Run tests before commits when implemented

## Important Considerations

1. **Facebook API Limits**: Be aware of rate limits and implement appropriate delays for bulk operations
2. **Image Requirements**: Facebook has specific requirements for ad images (size, format, etc.)
3. **Validation**: Always validate on both frontend (Zod) and backend (Joi)
4. **Error Handling**: Use the centralized error handling middleware in backend
5. **Real-time Updates**: Use Supabase subscriptions for progress tracking
6. **Security**: Never expose Facebook tokens or Supabase service keys to frontend