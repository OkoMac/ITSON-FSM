# YETOMO Digital Delivery & Governance Platform

A modern Progressive Web Application (PWA) for managing the IDC Social Employment Fund (SEF) Programme. Built with cutting-edge technologies and featuring a stunning black liquid glass design inspired by Apple Music, Tesla, and Netflix.

## 🎯 Overview

YETOMO is a comprehensive field service management system that provides:

- **Biometric Attendance** - Face recognition and fingerprint check-in/out
- **Compliance Tracking** - Document verification and POPIA compliance
- **Proof of Work** - Photo evidence and task completion workflows
- **Site Management** - Multi-site operations with supervisor oversight
- **M&E Reporting** - IDC-aligned monitoring and evaluation
- **Offline-First** - Full functionality without internet connection
- **Real-time Sync** - Kwantu integration for payroll substantiation

## ✨ Features

### 🔐 Role-Based Access Control
- **Workers** - Check-in/out, task completion, profile management
- **Supervisors** - Site oversight, task assignment, feedback
- **Project Managers** - Multi-site management, reporting
- **Property Point Admin** - Full system access, M&E, Kwantu sync
- **IDC** - View-only access for monitoring

### 📱 Progressive Web App
- Install on any device (mobile, tablet, desktop)
- Works offline with automatic background sync
- Push notifications for important updates
- Native app-like experience

### 🎨 Glass Morphism Design
- Black liquid glass aesthetic
- Smooth animations and transitions
- Apple-inspired color palette
- Responsive mobile-first design
- WCAG 2.1 AA accessibility compliant

## 🚀 Tech Stack

### Frontend
- **React 18.2** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router v6** - Client-side routing
- **Zustand** - Lightweight state management
- **React Query** - Server state management

### Offline & PWA
- **IndexedDB (Dexie)** - Local database
- **Workbox** - Service worker management
- **Vite PWA Plugin** - PWA manifest generation

### Biometrics
- **Face-API.js** - Facial recognition
- **WebAuthn API** - Fingerprint scanning

### Data Visualization
- **Recharts** - Charts and graphs
- **Mapbox GL** - Interactive maps

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd ITSON-FSM
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── layout/         # Layout components (sidebar, header, etc.)
│   ├── biometric/      # Biometric-related components
│   ├── onboarding/     # Onboarding workflow components
│   ├── attendance/     # Attendance tracking components
│   ├── sites/          # Site management components
│   ├── tasks/          # Task management components
│   ├── dashboard/      # Dashboard components
│   └── shared/         # Shared/common components
├── pages/              # Page components (routes)
├── store/              # Zustand state stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   ├── db.ts          # IndexedDB utilities
│   └── cn.ts          # Class name utilities
├── hooks/              # Custom React hooks
├── assets/             # Static assets
├── styles/             # Global styles
│   └── globals.css    # Tailwind + custom styles
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## 🎨 Design System

### Colors
```css
/* Primary Background */
--glass-black: #000000 to #0a0a0a

/* Accent Colors */
--accent-blue: #0071e3
--status-success: #30d158
--status-warning: #ff9f0a
--status-error: #ff453a

/* Text */
--text-primary: #ffffff
--text-secondary: rgba(255, 255, 255, 0.6)
--text-tertiary: rgba(255, 255, 255, 0.4)
```

### Typography
- **Headings** - SF Pro Display (600-700 weight)
- **Body** - SF Pro Text (400-500 weight)
- **Data/Numbers** - SF Mono

### Spacing
Based on 8px unit: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px

## 🔒 Security & Compliance

### POPIA Compliance
- Explicit user consent workflows
- Data minimization principles
- Right to access and correction
- 7-year audit trail retention
- Secure biometric storage (hashed templates)

### Security Features
- Encrypted data at rest (IndexedDB)
- HTTPS/TLS 1.3 only
- Biometric templates (non-reversible)
- Role-based access control
- Audit logging for all actions

## 🗄️ Database Schema

The app uses IndexedDB for offline-first data storage:

- **participants** - Participant profiles and onboarding data
- **attendanceRecords** - Check-in/out records with biometric data
- **sites** - Site/facility information
- **tasks** - Work assignments and completions
- **documents** - Uploaded documents and verification status
- **kwantuSyncRecords** - Sync queue for Kwantu integration
- **auditLogs** - System audit trail
- **notifications** - In-app notifications

## 📱 PWA Capabilities

### Offline Support
- Full app functionality without internet
- Automatic background sync when online
- Conflict resolution (server wins)
- Pending action queue

### Installation
- iOS: "Add to Home Screen"
- Android: Native install prompt
- Desktop: Install via browser prompt

### Service Worker
- Cache-first for UI assets
- Network-first for API calls
- Background sync for attendance records
- Push notification support

## 🔄 Kwantu Integration

### Sync Triggers
- **Onboarding** - Real-time when participant verified
- **Attendance** - Daily at 00:30 + weekly summary
- **Payroll** - Monthly on 25th (configurable)
- **M&E Reports** - Monthly on 1st of following month

### Data Validation
- ≥80% biometric success rate required
- All compliance documents verified
- Cross-field validation (ID, affidavit, etc.)

## 🧪 Testing

### Test Credentials
```
Email: demo@yetomo.com
Password: any password
```

### Test Users
- Worker: John Doe (worker role)
- Supervisor: Jane Smith (supervisor role)
- Admin: Admin User (property-point role)

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

This generates optimized files in `dist/` directory.

### Hosting Options
- **Vercel** (recommended)
- **Netlify**
- **Firebase Hosting**
- Any static hosting service

### Environment Variables
Create `.env` file:
```
VITE_API_BASE_URL=https://api.yetomo.com
VITE_KWANTU_API_URL=https://kwantu.yetomo.com
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_BIOMETRIC_API_KEY=your_biometric_key
```

## 📊 Performance

### Lighthouse Scores (Target)
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
- PWA: 100

### Optimizations
- Code splitting by route
- Lazy loading for heavy components
- Image optimization (WebP with JPEG fallback)
- Tree-shaking unused code
- Minification and compression

## 🎯 Roadmap

### Phase 1 - MVP (Completed) ✅
- ✅ Authentication & RBAC
- ✅ Basic UI component library
- ✅ Routing and navigation
- ✅ PWA setup
- ✅ Offline-first architecture

### Phase 2 - Core Features (In Progress)
- [ ] Complete onboarding workflow
- [ ] Biometric check-in/out
- [ ] Task management
- [ ] Site management
- [ ] Admin dashboard

### Phase 3 - Advanced Features
- [ ] M&E reporting & exports
- [ ] Kwantu sync engine
- [ ] Impact stories
- [ ] Advanced analytics
- [ ] Push notifications

### Phase 4 - Polish
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] User documentation
- [ ] Video tutorials

## 📄 License

Proprietary - Property Point & IDC Social Employment Fund

## 🤝 Contributing

This is a private project for the SEF Programme. For questions or issues:
- Contact: Property Point Admin
- Email: admin@propertypoint.co.za

## 📞 Support

For technical support or feature requests, please contact:
- Technical Lead: [Your Name]
- Project Manager: [PM Name]
- Email: support@yetomo.com

---

Built with ❤️ for the IDC Social Employment Fund Programme
