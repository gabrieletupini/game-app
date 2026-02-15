# Game - Dating CRM Application Architecture

## Project Overview

**Game** is a personal CRM for dating that helps users organize social interactions through a 4-stage funnel system. Users can track conversations, manage leads, and visualize their social pipeline in a healthy, professional manner.

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **UI Library**: Material-UI or Tailwind CSS + Headless UI
- **Drag & Drop**: react-beautiful-dnd or dnd-kit
- **Charts**: Chart.js or Recharts for pie charts
- **Build Tool**: Vite
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Authentication**: JWT + bcrypt for password hashing
- **Validation**: Joi or Zod
- **File Upload**: Multer (for profile photos)
- **CORS**: cors middleware
- **Security**: helmet, express-rate-limit

### Database
- **Primary Database**: PostgreSQL
- **ORM**: Prisma or TypeORM
- **Migrations**: Built-in ORM migration system
- **Connection Pooling**: pg-pool

### Development & Deployment
- **Package Manager**: npm or yarn
- **Development**: Concurrently to run both frontend and backend
- **Environment**: dotenv for configuration
- **Testing**: Jest + React Testing Library
- **Code Quality**: ESLint + Prettier

## System Architecture

```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐    SQL Queries    ┌─────────────────┐
│   React Client  │ ◄──────────────────► │   Express API   │ ◄─────────────────► │   PostgreSQL    │
│                 │                      │                 │                     │                 │
│ • Funnel UI     │                      │ • Authentication│                     │ • Users         │
│ • Lead Cards    │                      │ • Lead CRUD     │                     │ • Leads         │
│ • Drag & Drop   │                      │ • File Upload   │                     │ • Interactions  │
│ • Charts        │                      │ • Business Logic│                     │ • Photos        │
└─────────────────┘                      └─────────────────┘                     └─────────────────┘
```

## Core Data Models

### User
- id (UUID, Primary Key)
- email (Unique, Not Null)
- password_hash (Not Null)
- created_at (Timestamp)
- updated_at (Timestamp)

### Lead
- id (UUID, Primary Key)
- user_id (Foreign Key to User)
- name (Not Null)
- profile_photo_url (Optional)
- platform_origin (Enum: Tinder, Bumble, Instagram, Facebook, WhatsApp, Offline, Other)
- country_of_origin (String)
- personality_traits (Text)
- notes (Text)
- qualification_score (Integer 1-10)
- funnel_stage (Enum: Stage1, Stage2, Stage3, Stage4, Lover, Dead)
- origin_details (String - where/how met)
- temperature (Enum: Cold, Warm, Hot)
- last_interaction_date (Timestamp)
- created_at (Timestamp)
- updated_at (Timestamp)

### Interaction
- id (UUID, Primary Key)
- lead_id (Foreign Key to Lead)
- interaction_type (Enum: Message, Call, Date, Meeting)
- direction (Enum: Incoming, Outgoing)
- notes (Text)
- occurred_at (Timestamp)
- created_at (Timestamp)

## Key Features Implementation

### 1. Funnel System
- 4 main stages + Lovers + Dead Leads tables
- Drag and drop between stages
- Auto-progression rules
- Visual progress indicators

### 2. Lead Management
- Photo-based card system
- Detailed popup modals
- Qualification scoring
- Smart sorting algorithms

### 3. Communication Tracking
- Auto-calculation of "days since last spoken"
- Temperature assessment based on engagement
- Interaction history logging

### 4. Analytics Dashboard
- Pie chart showing lead origins
- Funnel conversion metrics
- Lead distribution analysis

### 5. Security & Privacy
- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure file upload handling

## API Endpoints Structure

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/verify`

### Leads Management
- `GET /api/leads` - Get all leads for user
- `POST /api/leads` - Create new lead
- `GET /api/leads/:id` - Get specific lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `PATCH /api/leads/:id/stage` - Update funnel stage

### Interactions
- `GET /api/leads/:id/interactions` - Get lead interactions
- `POST /api/leads/:id/interactions` - Add interaction
- `PUT /api/interactions/:id` - Update interaction

### Analytics
- `GET /api/analytics/funnel-stats` - Get funnel metrics
- `GET /api/analytics/origin-distribution` - Get lead sources

### File Upload
- `POST /api/upload/profile-photo` - Upload lead photo

## Frontend Component Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Loading.tsx
│   │   └── ErrorBoundary.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── funnel/
│   │   ├── FunnelBoard.tsx
│   │   ├── FunnelStage.tsx
│   │   ├── LeadCard.tsx
│   │   └── LeadModal.tsx
│   ├── analytics/
│   │   ├── OriginChart.tsx
│   │   └── FunnelStats.tsx
│   └── tables/
│       ├── LoversTable.tsx
│       └── DeadLeadsTable.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useLeads.ts
│   └── useDragDrop.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── leads.ts
├── store/
│   ├── authSlice.ts
│   ├── leadsSlice.ts
│   └── store.ts
├── types/
│   ├── User.ts
│   ├── Lead.ts
│   └── api.ts
└── utils/
    ├── dateHelpers.ts
    ├── validationSchemas.ts
    └── constants.ts
```

## Development Phases

### Phase 1: Foundation (MVP)
- Basic authentication system
- Simple lead CRUD operations
- Basic funnel visualization
- Core drag-and-drop functionality

### Phase 2: Enhanced Features
- Advanced lead management
- Communication tracking
- Temperature calculation
- Photo upload system

### Phase 3: Analytics & Polish
- Origin distribution charts
- Advanced sorting/filtering
- Responsive design
- Performance optimization

### Phase 4: Production Ready
- Security hardening
- Error handling
- Testing coverage
- Deployment preparation

## Security Considerations

1. **Authentication Security**
   - Strong password requirements
   - JWT token expiration
   - Secure cookie handling

2. **Data Protection**
   - Input validation on all endpoints
   - SQL injection prevention via ORM
   - XSS protection with proper sanitization

3. **File Upload Security**
   - File type validation
   - Size limits
   - Secure storage paths

4. **Privacy**
   - User data isolation
   - Secure deletion capabilities
   - Encrypted sensitive fields

## Performance Optimizations

1. **Frontend**
   - React.memo for expensive components
   - Virtual scrolling for large lists
   - Lazy loading of images
   - Code splitting with React.lazy

2. **Backend**
   - Database indexing on frequently queried fields
   - Pagination for large datasets
   - Response caching for static data
   - Connection pooling

3. **Database**
   - Proper indexing strategy
   - Query optimization
   - Regular maintenance procedures