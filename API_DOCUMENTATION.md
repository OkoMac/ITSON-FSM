# ITSON FSM Platform - API Documentation

**Version**: 1.0.0
**Last Updated**: February 6, 2026
**Base URL**: `https://api.itson-fsm.com/api` (production)
**Base URL**: `http://localhost:5000/api` (development)

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Participant Management](#participant-management)
4. [Attendance](#attendance)
5. [Tasks](#tasks)
6. [Sites](#sites)
7. [Teams](#teams)
8. [Onboarding & Invites](#onboarding--invites)
9. [WhatsApp Integration](#whatsapp-integration)
10. [External System Sync](#external-system-sync)
11. [Reports & M&E](#reports--me)
12. [Analytics](#analytics)
13. [File Uploads](#file-uploads)
14. [Webhooks](#webhooks)
15. [Error Handling](#error-handling)

---

## Authentication

All API endpoints (except webhooks and public onboarding pages) require authentication via JWT token.

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@itsonfsm.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@itsonfsm.com",
      "name": "System Admin",
      "role": "system-admin"
    }
  }
}
```

### Using the Token

Include the token in the Authorization header for all subsequent requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### User Roles

- `system-admin` - Full system access
- `idc-admin` - IDC administrative access
- `project-manager` - Project management
- `property-point` - Property liaison
- `supervisor` - Team supervision
- `general-worker` - Standard worker access

---

## User Management

### Get All Users

```http
GET /api/users?role=supervisor&status=active&search=john&page=1&limit=50
Authorization: Bearer {token}
```

**Query Parameters:**
- `role` (optional) - Filter by role
- `status` (optional) - Filter by status (active, inactive)
- `search` (optional) - Search by name or email
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Results per page

**Required Role:** Admin, Project Manager

### Create User

```http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "supervisor@example.com",
  "password": "SecurePass123",
  "name": "John Supervisor",
  "role": "supervisor",
  "phone": "+27123456789",
  "site_id": "uuid",
  "status": "active"
}
```

**Required Role:** Admin, Project Manager

### Update User

```http
PATCH /api/users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Smith Updated",
  "phone": "+27987654321",
  "role": "supervisor",
  "status": "active"
}
```

**Required Role:** Admin, Project Manager (or self for limited fields)

### Delete User

```http
DELETE /api/users/{userId}
Authorization: Bearer {token}
```

**Required Role:** Admin, Project Manager

---

## Participant Management

### Get All Participants

```http
GET /api/participants?status=active&site_id=uuid
Authorization: Bearer {token}
```

**Required Role:** Admin, Project Manager, Property Point

### Enroll Biometric

```http
POST /api/participants/{participantId}/enroll-biometric
Authorization: Bearer {token}
Content-Type: application/json

{
  "faceDescriptor": [0.123, -0.456, ...], // 128-dimension array
  "photoUrl": "https://..."
}
```

**Required Role:** Any authenticated user

### Upload Document

```http
POST /api/participants/{participantId}/upload-document
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary data]
documentType: "sa_id" | "proof_of_residence" | "certificate"
```

---

## Attendance

### Check In

```http
POST /api/attendance/check-in
Authorization: Bearer {token}
Content-Type: application/json

{
  "participant_id": "uuid",
  "site_id": "uuid",
  "latitude": -33.9249,
  "longitude": 18.4241,
  "biometric_verified": true,
  "face_match_confidence": 95.5
}
```

### Check Out

```http
POST /api/attendance/check-out
Authorization: Bearer {token}
Content-Type: application/json

{
  "attendance_id": "uuid",
  "latitude": -33.9249,
  "longitude": 18.4241
}
```

### Get My Attendance

```http
GET /api/attendance/my-attendance?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer {token}
```

### Today's Status

```http
GET /api/attendance/today-status
Authorization: Bearer {token}
```

---

## Tasks

### Get My Tasks

```http
GET /api/tasks/my-tasks?status=pending
Authorization: Bearer {token}
```

### Create Task

```http
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Inspect fire equipment",
  "description": "Check all fire extinguishers on level 3",
  "assigned_to": "participant-uuid",
  "site_id": "site-uuid",
  "priority": "high",
  "due_date": "2026-02-10T10:00:00Z",
  "category": "safety_inspection"
}
```

**Required Role:** Supervisor, Project Manager, Admin

### Update Task Status

```http
PATCH /api/tasks/{taskId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "completed",
  "completion_notes": "All equipment checked and serviceable"
}
```

---

## Teams

### Get All Teams

```http
GET /api/teams?site_id=uuid&supervisor_id=uuid
Authorization: Bearer {token}
```

### Create Team

```http
POST /api/teams
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Site A Morning Team",
  "description": "Morning shift team for Site A",
  "supervisor_id": "user-uuid",
  "site_id": "site-uuid"
}
```

### Add Team Member

```http
POST /api/teams/{teamId}/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "user-uuid"
}
```

### Remove Team Member

```http
DELETE /api/teams/{teamId}/members/{userId}
Authorization: Bearer {token}
```

---

## Onboarding & Invites

### Create Allowed Contact

```http
POST /api/onboarding/contacts
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+27123456789",
  "method": "app" | "whatsapp"
}
```

### Bulk Create Contacts

```http
POST /api/onboarding/contacts/bulk
Authorization: Bearer {token}
Content-Type: application/json

{
  "contacts": [
    {
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+27111111111",
      "method": "app"
    },
    {
      "name": "Mary Johnson",
      "email": "mary@example.com",
      "phone": "+27222222222",
      "method": "whatsapp"
    }
  ]
}
```

### Send Individual Invite

```http
POST /api/onboarding/contacts/{contactId}/send
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "inviteLink": "https://app.itson-fsm.com/onboarding?invite=abc123-...",
    "message": "Hi Jane! You've been invited to join ITSON FSM...",
    "method": "app",
    "recipient": "jane@example.com"
  }
}
```

### Broadcast Invites

```http
POST /api/onboarding/invites/broadcast
Authorization: Bearer {token}
Content-Type: application/json

{
  "contactIds": ["uuid1", "uuid2", "uuid3"]
}
```

### Get Invite (Public - No Auth Required)

```http
GET /api/onboarding/invite/{inviteCode}
```

---

## WhatsApp Integration

### Webhook Verification (Facebook Required)

```http
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE
```

### Webhook (Incoming Messages)

```http
POST /api/whatsapp/webhook
Content-Type: application/json

{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "messages": [{
          "from": "27123456789",
          "id": "wamid.xxx",
          "type": "text",
          "text": { "body": "Hello" }
        }]
      }
    }]
  }]
}
```

### Get WhatsApp Sessions

```http
GET /api/whatsapp/sessions?status=active
Authorization: Bearer {token}
```

**Required Role:** Admin, Project Manager, Property Point

---

## External System Sync

### Sync Single Participant

```http
POST /api/sync/participants/{participantId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "targetSystem": "kwantu" | "hr_system"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "syncRecord": {
      "id": "sync-uuid",
      "status": "synced",
      "syncedAt": "2026-02-06T10:30:00Z"
    }
  }
}
```

### Bulk Sync Participants

```http
POST /api/sync/participants/bulk
Authorization: Bearer {token}
Content-Type: application/json

{
  "participantIds": ["uuid1", "uuid2", "uuid3"],
  "targetSystem": "kwantu"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "results": {
      "successful": ["uuid1", "uuid2"],
      "failed": [{
        "id": "uuid3",
        "error": "Participant not verified"
      }]
    }
  }
}
```

### Get Sync History

```http
GET /api/sync/history?targetSystem=kwantu&status=synced&page=1&limit=50
Authorization: Bearer {token}
```

### Get Sync Status for Record

```http
GET /api/sync/status/{recordId}
Authorization: Bearer {token}
```

### Retry Failed Sync

```http
POST /api/sync/{syncId}/retry
Authorization: Bearer {token}
```

### Configure Sync Settings (Admin Only)

```http
POST /api/sync/configure
Authorization: Bearer {token}
Content-Type: application/json

{
  "targetSystem": "kwantu",
  "enabled": true,
  "autoSync": false,
  "syncFrequency": "daily",
  "webhookUrl": "https://kwantu.example.com/webhook",
  "apiKey": "your-api-key-here"
}
```

---

## Reports & M&E

### Generate Attendance Report

```http
GET /api/reports/attendance?startDate=2026-01-01&endDate=2026-01-31&siteId=uuid
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "records": [...],
    "summary": {
      "totalRecords": 450,
      "totalHoursWorked": 3600,
      "averageHoursPerDay": 8,
      "biometricVerifiedCount": 448,
      "attendanceByStatus": {
        "present": 440,
        "absent": 5,
        "late": 5,
        "excused": 0
      }
    },
    "generatedAt": "2026-02-06T10:00:00Z",
    "generatedBy": "Admin User"
  }
}
```

### Generate Participants Report

```http
GET /api/reports/participants?status=active&siteId=uuid
Authorization: Bearer {token}
```

### Generate Tasks Report

```http
GET /api/reports/tasks?status=completed&priority=high&startDate=2026-01-01
Authorization: Bearer {token}
```

### Generate Compliance Report

```http
GET /api/reports/compliance
Authorization: Bearer {token}
```

**Response includes:**
- POPIA consent rates
- Code of Conduct signing rates
- Biometric enrollment rates
- Overall compliance metrics

### Generate M&E Report

```http
GET /api/reports/me?startDate=2026-01-01&endDate=2026-01-31&siteId=uuid
Authorization: Bearer {token}
```

**IDC-Aligned Monitoring & Evaluation Report**

### Export Report

```http
GET /api/reports/export?reportType=attendance&format=csv&startDate=2026-01-01
Authorization: Bearer {token}
```

**Supported Formats:**
- `csv` - Comma-separated values
- `excel` - Microsoft Excel
- `pdf` - PDF document

---

## Analytics

### Get Dashboard Analytics

```http
GET /api/analytics/dashboard?period=30days&siteId=uuid
Authorization: Bearer {token}
```

**Period Options:** `7days`, `30days`, `90days`, `year`

**Response:**
```json
{
  "status": "success",
  "data": {
    "analytics": {
      "overview": {
        "totalParticipants": 250,
        "activeParticipants": 220,
        "totalAttendanceRecords": 5400,
        "totalTasks": 850,
        "todayAttendance": 180
      },
      "participants": {
        "byStatus": { "active": 220, "verified": 15, "pending": 10, "inactive": 5 },
        "byGender": { "male": 180, "female": 65, "other": 5 },
        "biometricEnrollment": {
          "enrolled": 245,
          "pending": 5,
          "enrollmentRate": 98
        }
      },
      "attendance": {
        "total": 5400,
        "totalHoursWorked": 43200,
        "averageHoursPerDay": 8,
        "biometricVerificationRate": 99.5
      },
      "tasks": {
        "total": 850,
        "completionRate": 92,
        "averageCompletionTime": 2.5
      }
    }
  }
}
```

### Get Attendance Trends

```http
GET /api/analytics/trends/attendance?period=30days&groupBy=day
Authorization: Bearer {token}
```

### Get Task Trends

```http
GET /api/analytics/trends/tasks?period=30days
Authorization: Bearer {token}
```

### Get Participant Growth

```http
GET /api/analytics/trends/participants?period=12months
Authorization: Bearer {token}
```

### Get Site Performance Comparison

```http
GET /api/analytics/performance/sites
Authorization: Bearer {token}
```

### Get Top Performers

```http
GET /api/analytics/performance/top-performers?limit=10&metric=hours&period=30days
Authorization: Bearer {token}
```

**Metric Options:** `hours`, `tasks`, `days`

---

## File Uploads

### Single File Upload

```http
POST /api/upload/single
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary data]
```

### Multiple Files Upload

```http
POST /api/upload/multiple
Authorization: Bearer {token}
Content-Type: multipart/form-data

files: [binary data array]
```

**Supported File Types:**
- Images: JPG, PNG, HEIC
- Documents: PDF, DOC, DOCX
- Spreadsheets: XLS, XLSX, CSV

**Max File Size:** 10MB per file

---

## Webhooks

### HR System Webhook (Incoming)

Your HR system can send data to ITSON FSM via webhook:

```http
POST https://api.itson-fsm.com/api/webhooks/hr
Content-Type: application/json
Authorization: Bearer {webhook_secret}

{
  "event": "employee.created" | "employee.updated" | "employee.terminated",
  "timestamp": "2026-02-06T10:00:00Z",
  "data": {
    "employeeId": "HR12345",
    "name": "John Doe",
    "email": "john@company.com",
    "phone": "+27123456789",
    "department": "Facilities",
    "role": "general-worker",
    "startDate": "2026-02-01"
  }
}
```

### Outgoing Webhooks (ITSON FSM → External Systems)

Configure outgoing webhooks in sync settings. ITSON FSM will POST to your webhook URL:

```json
{
  "event": "participant.verified" | "attendance.checked_in" | "task.completed",
  "timestamp": "2026-02-06T10:00:00Z",
  "source": "itson-fsm",
  "data": {
    "participantId": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "status": "verified",
    "biometricEnrolled": true
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ]
}
```

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (wrong role)
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Rate Limiting

- **Rate Limit:** 100 requests per minute per IP
- **Headers:**
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1675675200`

---

## Integration Examples

### Example: Sync with Kwantu

```javascript
// 1. Configure Kwantu sync
const configResponse = await fetch('https://api.itson-fsm.com/api/sync/configure', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetSystem: 'kwantu',
    enabled: true,
    autoSync: true,
    syncFrequency: 'daily',
    webhookUrl: 'https://kwantu.example.com/api/webhook',
    apiKey: 'KWANTU_API_KEY'
  })
});

// 2. Sync a participant
const syncResponse = await fetch('https://api.itson-fsm.com/api/sync/participants/PARTICIPANT_ID', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetSystem: 'kwantu'
  })
});

// 3. Check sync status
const statusResponse = await fetch('https://api.itson-fsm.com/api/sync/status/PARTICIPANT_ID', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

### Example: HR System Integration

```javascript
// Your HR system sends new employee data
const response = await fetch('https://api.itson-fsm.com/api/onboarding/contacts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ITSON_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'New Employee',
    email: 'employee@company.com',
    phone: '+27123456789',
    method: 'app'
  })
});

// Send onboarding invite
const inviteResponse = await fetch(`https://api.itson-fsm.com/api/onboarding/contacts/${contactId}/send`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ITSON_TOKEN'
  }
});
```

---

## SDKs and Libraries

### JavaScript/TypeScript SDK (Coming Soon)

```bash
npm install @itson/fsm-sdk
```

```typescript
import { ITSONClient } from '@itson/fsm-sdk';

const client = new ITSONClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://api.itson-fsm.com'
});

// Sync participant
await client.sync.participant('participant-id', 'kwantu');

// Get reports
const report = await client.reports.attendance({
  startDate: '2026-01-01',
  endDate: '2026-01-31'
});
```

---

## Support

- **Documentation:** https://docs.itson-fsm.com
- **API Status:** https://status.itson-fsm.com
- **Support Email:** support@itson-fsm.com
- **GitHub:** https://github.com/itson-fsm

---

## Changelog

### v1.0.0 (2026-02-06)
- Initial API release
- Complete CRUD operations for all resources
- External system sync (Kwantu, HR systems)
- Comprehensive reporting and analytics
- WhatsApp Business API integration
- Biometric authentication support
- M&E reporting (IDC-aligned)

---

**© 2026 ITSON FSM. All rights reserved.**
