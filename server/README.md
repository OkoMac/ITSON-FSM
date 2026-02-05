# ITSON FSM Backend API

Enterprise-grade REST API for the ITSON Facilities Management System.

## 🚀 Features

- ✅ **Authentication & Authorization**: JWT-based auth with role-based access control
- ✅ **PostgreSQL Database**: Robust relational database with migrations
- ✅ **TypeScript**: Full type safety
- ✅ **Security**: Helmet, CORS, rate limiting, password hashing
- ✅ **Validation**: Request validation with express-validator
- ✅ **Logging**: Morgan for HTTP logs, Winston for application logs
- ✅ **Error Handling**: Centralized error handling middleware

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm >= 9.0.0

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb itson_fsm

# Or using psql
psql -U postgres
CREATE DATABASE itson_fsm;
\q
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=itson_fsm
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 4. Run Database Migrations

```bash
npm run db:migrate
```

### 5. (Optional) Seed Database

```bash
npm run db:seed
```

## 🏃 Running the Server

### Development Mode (with hot reload)

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

Server will run on: **http://localhost:5000**

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

---

## 🔐 Authentication Endpoints

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "worker"
}
```

**Roles**: `worker`, `supervisor`, `project-manager`, `property-point`, `idc-admin`, `system-admin`

Response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "worker"
    },
    "token": "jwt.token.here"
  }
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "worker"
    },
    "token": "jwt.token.here"
  }
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Change Password

```http
PATCH /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

---

## 🏢 Sites Endpoints

### Get All Sites

```http
GET /api/sites
Authorization: Bearer <token>
```

Query parameters:
- `status`: Filter by status (`active`, `inactive`, `maintenance`)
- `search`: Search by name or address

### Get Single Site

```http
GET /api/sites/:id
Authorization: Bearer <token>
```

### Create Site

```http
POST /api/sites
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Main Factory Site",
  "address": "123 Industrial Rd, Johannesburg",
  "latitude": -26.2041,
  "longitude": 28.0473,
  "contactPerson": "Jane Smith",
  "contactPhone": "+27123456789",
  "contactEmail": "jane@example.com",
  "status": "active"
}
```

**Required roles**: `supervisor`, `project-manager`, `system-admin`

### Update Site

```http
PATCH /api/sites/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Site Name",
  "status": "active"
}
```

**Required roles**: `supervisor`, `project-manager`, `system-admin`

### Delete Site (Soft Delete)

```http
DELETE /api/sites/:id
Authorization: Bearer <token>
```

**Required roles**: `project-manager`, `system-admin`

---

## 📋 Tasks Endpoints

```http
GET /api/tasks                    # Get all tasks
GET /api/tasks/:id                # Get single task
POST /api/tasks                   # Create task
PATCH /api/tasks/:id              # Update task
DELETE /api/tasks/:id             # Delete task
```

*(Placeholder - controllers to be implemented)*

---

## 👥 Attendance Endpoints

```http
GET /api/attendance               # Get attendance records
POST /api/attendance/check-in     # Check in
POST /api/attendance/check-out    # Check out
```

*(Placeholder - controllers to be implemented)*

---

## 📊 Database Schema

### Users Table
- `id` (UUID, PK)
- `email` (string, unique)
- `password_hash` (string)
- `name` (string)
- `role` (enum: worker, supervisor, etc.)
- `status` (enum: active, inactive, suspended)
- `phone`, `profile_picture`
- `created_at`, `updated_at`, `deleted_at`

### Sites Table
- `id` (UUID, PK)
- `name`, `address`
- `latitude`, `longitude`
- `contact_person`, `contact_phone`, `contact_email`
- `status` (enum: active, inactive, maintenance)
- `metadata` (JSONB)
- `created_at`, `updated_at`, `deleted_at`

### Tasks Table
- `id` (UUID, PK)
- `title`, `description`
- `priority` (enum: low, medium, high, urgent)
- `status` (enum: pending, in-progress, completed, etc.)
- `site_id` (FK → sites)
- `assigned_to_id`, `assigned_by_id` (FK → users)
- `due_date`, `completed_at`
- `requires_photo_evidence`, `proof_photos` (JSONB)
- `completion_note`, `supervisor_feedback`, `quality_rating`
- `created_at`, `updated_at`, `deleted_at`

### Participants Table
- `id` (UUID, PK)
- `user_id` (FK → users)
- `site_id` (FK → sites)
- Personal info: `full_name`, `sa_id_number`, `date_of_birth`, etc.
- Emergency contact details
- Program details: `status`, `start_date`, `end_date`
- Compliance: `popia_consent`, `code_of_conduct_signed`
- `documents` (JSONB), `biometric_data` (JSONB)
- `created_at`, `updated_at`, `deleted_at`

### Attendance Records Table
- `id` (UUID, PK)
- `participant_id` (FK → participants)
- `site_id` (FK → sites)
- `date`, `check_in_time`, `check_out_time`
- `check_in_location`, `check_out_location` (JSONB)
- `check_in_method`, `check_out_method` (enum: face, fingerprint)
- `check_in_photo`, `check_out_photo`
- `biometric_confidence`
- `status` (enum: present, absent, late, excused)
- `synced`, `synced_at`
- `created_at`, `updated_at`

---

## 🔒 Security Features

### Password Security
- Bcrypt hashing (12 rounds)
- Password complexity requirements (implement in validation)
- Password change tracking

### JWT Tokens
- Secure token generation
- Configurable expiration
- Token verification middleware

### Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 attempts per 15 minutes

### CORS
- Configurable allowed origins
- Credentials support

### Headers Security
- Helmet.js for secure headers
- XSS protection
- Content Security Policy

---

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── database.ts           # Database connection
│   ├── controllers/
│   │   ├── auth.controller.ts    # Authentication logic
│   │   └── site.controller.ts    # Sites CRUD
│   ├── database/
│   │   ├── migrations/           # Database migrations
│   │   └── seeds/                # Seed data
│   ├── middleware/
│   │   ├── auth.ts               # JWT verification
│   │   ├── errorHandler.ts      # Error handling
│   │   ├── notFoundHandler.ts   # 404 handler
│   │   └── rateLimiter.ts       # Rate limiting
│   ├── routes/
│   │   ├── auth.routes.ts       # Auth routes
│   │   ├── site.routes.ts       # Sites routes
│   │   ├── task.routes.ts       # Tasks routes (placeholder)
│   │   └── ...                  # Other routes
│   └── index.ts                 # App entry point
├── .env.example                 # Environment template
├── knexfile.ts                  # Database config
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧪 Testing

```bash
npm test
```

*(Test implementation pending)*

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables

Ensure all production environment variables are set:
- `NODE_ENV=production`
- `DB_*` - Production database credentials
- `JWT_SECRET` - Strong secret key
- `FRONTEND_URL` - Production frontend URL

### Database Migrations

```bash
NODE_ENV=production npm run db:migrate
```

---

## 🐛 Troubleshooting

### Database Connection Error

```
❌ Database connection failed: ECONNREFUSED
```

**Solution**: Check PostgreSQL is running and credentials in `.env` are correct.

### Port Already in Use

```
❌ Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**: Change `PORT` in `.env` or kill process using port 5000.

### JWT Token Invalid

```
401 Unauthorized: Invalid token
```

**Solution**: Token may be expired or `JWT_SECRET` mismatch. Re-login to get new token.

---

## 📝 TODO

- [ ] Implement Task controller
- [ ] Implement Attendance controller
- [ ] Implement Participant controller
- [ ] Add file upload service (S3/local)
- [ ] Add WhatsApp Business API integration
- [ ] Add email service (SendGrid/SES)
- [ ] Add SMS service (Twilio)
- [ ] Implement comprehensive tests
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add logging service (Winston)
- [ ] Implement WebSocket for real-time updates

---

## 📄 License

MIT

## 👥 Contributors

ITSON FSM Development Team
