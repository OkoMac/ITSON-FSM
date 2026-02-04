# ITSON FSM - Complete Integration Guide

## Overview

This guide documents the complete integration between the frontend and backend systems, including WhatsApp Business API integration for automated onboarding.

## What's Been Integrated ✅

### 1. Authentication System
- **Status**: ✅ Complete
- **Files**:
  - Frontend: `src/store/useAuthStore.ts`
  - Backend: `server/src/controllers/auth.controller.ts`
- **Features**:
  - JWT token-based authentication
  - Secure password hashing with bcrypt
  - Role-based access control (6 roles)
  - Token persistence in localStorage

### 2. API Service Layer
- **Status**: ✅ Complete
- **File**: `src/services/api.ts`
- **Coverage**: 35+ endpoints
- **Categories**:
  - Authentication (login, register, getMe, changePassword)
  - Users (CRUD operations)
  - Sites (CRUD with filtering)
  - Tasks (CRUD + approval workflow)
  - Attendance (check-in/out with biometrics)
  - Participants (CRUD + biometric enrollment)
  - File uploads (single and multiple)
  - WhatsApp sessions (admin monitoring)

### 3. React Hooks for Data Fetching
- **Status**: ✅ Complete
- **Files**:
  - `src/hooks/useSites.ts` - Site management
  - `src/hooks/useTasks.ts` - Task management
  - `src/hooks/useAttendance.ts` - Attendance tracking
- **Features**:
  - Automatic data fetching
  - Real-time updates
  - Error handling
  - Loading states
  - CRUD operations

### 4. WhatsApp Business Integration
- **Status**: ✅ Complete
- **Backend Files**:
  - Controller: `server/src/controllers/whatsapp.controller.ts`
  - Routes: `server/src/routes/whatsapp.routes.ts`
  - Migration: `server/src/database/migrations/20240101000004_create_whatsapp_sessions_table.ts`
- **Database Tables**:
  - `whatsapp_sessions` - Track onboarding progress
  - `whatsapp_messages` - Message history
- **Features**:
  - Webhook endpoint for WhatsApp Business API
  - Multi-stage onboarding flow (14 stages)
  - Automatic participant creation
  - Document upload via WhatsApp
  - POPIA consent tracking
  - Session management
  - Message history

### 5. Database Schema
- **Status**: ✅ Complete
- **Tables**: 7 total
  - `users` - System users with roles
  - `sites` - Work locations
  - `tasks` - Task assignments
  - `participants` - Worker profiles
  - `attendance_records` - Check-in/out data
  - `whatsapp_sessions` - WhatsApp onboarding
  - `whatsapp_messages` - WhatsApp message log

---

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- WhatsApp Business Account (for production)
- Twilio Account (optional alternative)

### 1. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Configure environment variables (see below)
nano .env

# Run database migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

### 2. Environment Variables

Edit `server/.env`:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=itson_fsm
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# WhatsApp (choose one option)

# Option 1: WhatsApp Business API (Meta)
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Option 2: Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 3. Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start development server
npm run dev
```

### 4. WhatsApp Business API Setup

#### Using Meta WhatsApp Business API:

1. **Create Facebook App**
   - Go to https://developers.facebook.com/
   - Create a new app
   - Add WhatsApp product

2. **Configure Webhook**
   - Webhook URL: `https://your-domain.com/api/whatsapp/webhook`
   - Verify Token: (use the one from your .env)
   - Subscribe to: `messages` events

3. **Get Access Token**
   - In WhatsApp Dashboard, generate permanent access token
   - Add to `.env` as `WHATSAPP_ACCESS_TOKEN`

4. **Get Phone Number ID**
   - In WhatsApp Dashboard, find your phone number
   - Copy Phone Number ID to `.env`

#### Using Twilio (Alternative):

1. **Create Twilio Account**
   - Sign up at https://www.twilio.com/

2. **Enable WhatsApp**
   - Activate WhatsApp sandbox for testing
   - Get production number for deployment

3. **Configure Webhook**
   - In Twilio Console, set webhook URL:
   - `https://your-domain.com/api/whatsapp/webhook`

4. **Update Code**
   - Uncomment Twilio code in `whatsapp.controller.ts` line 400+
   - Comment out Meta WhatsApp code

---

## API Endpoints Reference

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PATCH  /api/auth/change-password
```

### Sites
```
GET    /api/sites
GET    /api/sites/:id
POST   /api/sites
PATCH  /api/sites/:id
DELETE /api/sites/:id
```

### Tasks
```
GET    /api/tasks
GET    /api/tasks/:id
GET    /api/tasks/my-tasks
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/approve
PATCH  /api/tasks/:id/reject
```

### Attendance
```
GET    /api/attendance
POST   /api/attendance/check-in
POST   /api/attendance/check-out
GET    /api/attendance/my-attendance
GET    /api/attendance/today-status
GET    /api/attendance/stats
PATCH  /api/attendance/:id/status
```

### Participants
```
GET    /api/participants
GET    /api/participants/:id
GET    /api/participants/me
POST   /api/participants
PATCH  /api/participants/:id
DELETE /api/participants/:id
POST   /api/participants/:id/enroll-biometric
POST   /api/participants/:id/upload-document
GET    /api/participants/stats
```

### File Upload
```
POST   /api/upload/single
POST   /api/upload/multiple
```

### WhatsApp (Admin Only)
```
GET    /api/whatsapp/webhook (webhook verification)
POST   /api/whatsapp/webhook (receive messages)
GET    /api/whatsapp/sessions
GET    /api/whatsapp/sessions/:id
POST   /api/whatsapp/send
```

---

## WhatsApp Onboarding Flow

### Stage Progression

1. **Initial** → Welcome message
2. **Waiting Name** → Collect full name
3. **Waiting SA ID** → Collect 13-digit ID (validated)
4. **Waiting DOB** → Collect date of birth (YYYY-MM-DD)
5. **Waiting Gender** → Collect gender
6. **Waiting Address** → Collect residential address
7. **Waiting Emergency Contact** → Collect emergency contact name
8. **Waiting Emergency Phone** → Collect emergency phone
9. **Waiting Emergency Relationship** → Collect relationship
10. **Waiting Photo** → Upload selfie (biometric)
11. **Waiting SA ID Document** → Upload ID document
12. **Waiting Proof of Residence** → Upload proof document
13. **Waiting POPIA Consent** → Must reply "I CONSENT"
14. **Waiting Code of Conduct** → Must reply "I AGREE"
15. **Completed** → Participant created, pending approval

### Example Conversation

```
Bot: Welcome to ITSON FSM! 👋
     Let's get you registered. What is your full name?
User: John Doe

Bot: Thanks John Doe! 📝
     Please provide your South African ID number (13 digits).
User: 9001015800086

Bot: Great! Now, what is your date of birth? (Format: YYYY-MM-DD)
User: 1990-01-15

[... continues through all stages ...]

Bot: 🎉 Registration Complete!
     Your profile has been created successfully.
```

---

## Using React Hooks in Pages

### Example: Sites Page

```typescript
import { useSites } from '@/hooks/useSites';

const SitesPage = () => {
  const { sites, isLoading, error, createSite, updateSite } = useSites();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      {sites.map(site => (
        <SiteCard key={site.id} site={site} />
      ))}
    </div>
  );
};
```

### Example: Tasks Page

```typescript
import { useTasks } from '@/hooks/useTasks';

const TasksPage = () => {
  const { tasks, isLoading, approveTask, rejectTask } = useTasks({
    status: 'pending',
  });

  const handleApprove = async (taskId: string) => {
    await approveTask(taskId, 'Well done!');
  };

  return (
    <div>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onApprove={() => handleApprove(task.id)}
        />
      ))}
    </div>
  );
};
```

### Example: Check-In Page

```typescript
import { useAttendance } from '@/hooks/useAttendance';

const CheckInPage = () => {
  const { checkIn, getTodayStatus } = useAttendance();

  const handleCheckIn = async () => {
    const location = await getCurrentPosition();
    await checkIn({
      siteId: selectedSite.id,
      checkInLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      },
      checkInMethod: 'face',
      biometricConfidence: 0.95,
    });
  };

  return <Button onClick={handleCheckIn}>Check In</Button>;
};
```

---

## Testing

### Backend API Testing

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@itsonfsm.com", "password": "password123"}'

# Get sites (with token)
curl http://localhost:5000/api/sites \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create task
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "Test description",
    "priority": "high",
    "site_id": "SITE_ID",
    "assigned_to_id": "USER_ID"
  }'
```

### WhatsApp Webhook Testing

```bash
# Simulate incoming message
curl -X POST http://localhost:5000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "field": "messages",
        "value": {
          "messages": [{
            "from": "27123456789",
            "id": "wamid.test",
            "timestamp": "1234567890",
            "text": { "body": "Hello" },
            "type": "text"
          }],
          "metadata": {}
        }
      }]
    }]
  }'
```

---

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `psql -U postgres -c "SELECT 1;"`
- Verify `.env` database credentials
- Run migrations: `npm run db:migrate`

### Frontend can't connect to API
- Verify backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env`
- Check CORS settings in `server/src/index.ts`

### WhatsApp webhook not receiving messages
- Verify webhook URL is publicly accessible (use ngrok for testing)
- Check webhook verification token matches
- Ensure WhatsApp app is subscribed to `messages` events
- Check server logs for errors

### Authentication fails
- Clear localStorage and cookies
- Check JWT_SECRET is set
- Verify user exists in database
- Check token expiration

### Tasks/Sites not loading
- Check browser console for errors
- Verify user is logged in (token exists)
- Check API endpoint returns data
- Verify role has permission for endpoint

---

## Production Deployment Checklist

### Security
- [ ] Change JWT_SECRET to strong random value
- [ ] Use strong database password
- [ ] Enable HTTPS/SSL certificates
- [ ] Set NODE_ENV=production
- [ ] Configure CORS to allow only your domain
- [ ] Enable rate limiting (already configured)
- [ ] Review and update helmet.js security headers

### Database
- [ ] Run migrations on production database
- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Set up read replicas (optional)

### WhatsApp
- [ ] Get production WhatsApp Business account approved
- [ ] Configure production webhook URL (HTTPS required)
- [ ] Set up message templates for compliance
- [ ] Test full onboarding flow

### Monitoring
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Configure uptime monitoring
- [ ] Set up database performance monitoring
- [ ] Monitor WhatsApp API usage/costs

### Performance
- [ ] Enable compression (already configured)
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize database queries with indexes

---

## Demo Credentials

After running `npm run db:seed`, use these credentials:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| System Admin | admin@itsonfsm.com | password123 | Full system access |
| Project Manager | manager@itsonfsm.com | password123 | Manage sites and tasks |
| Supervisor | supervisor@itsonfsm.com | password123 | Approve tasks, view reports |
| Worker 1 | worker1@itsonfsm.com | password123 | Check-in, complete tasks |
| Worker 2 | worker2@itsonfsm.com | password123 | Check-in, complete tasks |

---

## Support & Contact

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Email: support@itsonfsm.com
- Documentation: See README.md and other docs in `/docs`

---

## Next Steps

### Pending Integration Work

1. **Frontend Pages** (In Progress)
   - Update SitesPage to use `useSites` hook
   - Update TasksPage to use `useTasks` hook
   - Update DashboardPage to use aggregated data from APIs
   - Update CheckInPage to use `useAttendance` hook

2. **Real-time Features** (Not Started)
   - Implement WebSocket server
   - Add real-time task notifications
   - Live attendance dashboard updates

3. **Offline Sync** (Not Started)
   - Implement sync endpoint
   - Add conflict resolution
   - Background sync for PWA

4. **Email/SMS Notifications** (Not Started)
   - Integrate SendGrid/SES for email
   - Add Twilio SMS for alerts
   - Create notification templates

5. **Biometric Verification** (Backend Ready)
   - Integrate face recognition service
   - Add fingerprint validation
   - Implement confidence scoring

---

## Changelog

### 2024-02-04 - Complete Backend Integration
- ✅ Created complete API service layer
- ✅ Connected auth store to backend
- ✅ Implemented WhatsApp webhook controller
- ✅ Created WhatsApp session database tables
- ✅ Created React hooks for data fetching
- ✅ Documented complete integration guide
