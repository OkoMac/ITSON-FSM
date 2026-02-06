# Production Deployment Guide

Complete guide for deploying ITSON FSM to production.

---

## Table of Contents

1. [Infrastructure Setup](#1-infrastructure-setup)
2. [Database Configuration](#2-database-configuration)
3. [Backend Deployment](#3-backend-deployment)
4. [Frontend Deployment](#4-frontend-deployment)
5. [Environment Variables](#5-environment-variables)
6. [Domain & SSL](#6-domain--ssl)
7. [Monitoring & Logging](#7-monitoring--logging)
8. [Backup Strategy](#8-backup-strategy)
9. [Post-Deployment](#9-post-deployment)

---

## 1. Infrastructure Setup

### Recommended Stack

**Backend Hosting Options:**
- Railway (Recommended - Easy scaling, built-in PostgreSQL)
- Render (Good alternative)
- Heroku (Classic choice)
- AWS Elastic Beanstalk (Enterprise)

**Frontend Hosting Options:**
- Netlify (Recommended - Excellent PWA support)
- Vercel (Great DX)
- Cloudflare Pages (Fast CDN)

**Database:**
- Railway PostgreSQL (Managed)
- Render PostgreSQL (Managed)
- AWS RDS (Enterprise)
- Supabase (Modern alternative)

---

## 2. Database Configuration

### 2.1 Create Production Database

**Using Railway:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create new project
railway init

# Add PostgreSQL
railway add postgresql

# Get connection string
railway variables
# Copy DATABASE_URL
```

**Using Render:**
```bash
# Create database at dashboard.render.com
# Select: New > PostgreSQL
# Copy connection string
```

### 2.2 Run Migrations

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Run migrations
cd server
npm run migrate:latest

# Verify
npm run migrate:status
```

### 2.3 Seed Initial Data

```bash
# Create admin user
npm run seed:admin

# Or manually:
psql $DATABASE_URL -c "
INSERT INTO users (email, password, name, role, status)
VALUES (
  'admin@itsonfsm.com',
  '\$2a\$12\$hash_of_password',
  'System Administrator',
  'system-admin',
  'active'
);
"
```

---

## 3. Backend Deployment

### Option A: Railway (Recommended)

```bash
# Install CLI
npm i -g @railway/cli

# Login
railway login

# Initialize in server directory
cd server
railway init

# Link database
railway link [project-id]

# Set environment variables (see section 5)
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -hex 32)
# ... set all other variables

# Deploy
railway up

# Get URL
railway domain
# Your backend will be at: https://your-app.railway.app
```

### Option B: Render

1. Connect GitHub repository
2. Create new Web Service
3. Settings:
   - Build Command: `cd server && npm install && npm run build`
   - Start Command: `cd server && npm start`
   - Environment: Node
4. Add environment variables (see section 5)
5. Deploy

### Option C: Heroku

```bash
# Install Heroku CLI
npm i -g heroku

# Login
heroku login

# Create app
heroku create itson-fsm-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set buildpack
heroku buildpacks:set heroku/nodejs

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
# ... set all other variables

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate:latest --app itson-fsm-api

# Open logs
heroku logs --tail
```

---

## 4. Frontend Deployment

### Option A: Netlify (Recommended)

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Configure build settings
# Build command: npm run build
# Publish directory: dist
# Functions directory: netlify/functions (if using)

# Set environment variables
netlify env:set VITE_API_BASE_URL https://your-api.railway.app
netlify env:set VITE_USE_MOCK_API false
# ... set all other VITE_ variables

# Deploy
netlify deploy --prod

# Get URL: https://your-app.netlify.app
```

**Or via Dashboard:**
1. Go to app.netlify.com
2. "Add new site" > "Import an existing project"
3. Connect GitHub repository
4. Settings:
   - Branch: main
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables
6. Deploy

### Option B: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_API_BASE_URL production
vercel env add VITE_USE_MOCK_API production
# ... set all other VITE_ variables
```

### Option C: Cloudflare Pages

1. Go to dash.cloudflare.com
2. Pages > Create a project
3. Connect GitHub
4. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
5. Add environment variables
6. Deploy

---

## 5. Environment Variables

### Backend (.env)

```bash
# Required
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-domain.com

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-id
WHATSAPP_VERIFY_TOKEN=your-verify-token

# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...

# AWS (for file uploads)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=itson-fsm-production
AWS_REGION=af-south-1

# Optional
SENTRY_DSN=https://...
SENDGRID_API_KEY=SG....
```

### Frontend (VITE_)

```bash
# Required
VITE_API_BASE_URL=https://api.your-domain.com
VITE_USE_MOCK_API=false
VITE_AI_PROVIDER=claude

# Optional
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
VITE_SENTRY_DSN=https://...
VITE_GA_TRACKING_ID=G-...
```

---

## 6. Domain & SSL

### 6.1 Custom Domain

**Netlify:**
```bash
# Add domain
netlify domains:add your-domain.com

# Configure DNS:
# Add CNAME record: www -> your-app.netlify.app
# Add A record: @ -> Netlify's IP
```

**Railway:**
```bash
# Add domain in Railway dashboard
# Add CNAME record: api -> your-app.railway.app
```

### 6.2 SSL Certificate

Both Netlify and Railway provide automatic SSL via Let's Encrypt.

**Verify SSL:**
```bash
curl -I https://your-domain.com
# Should return: HTTP/2 200
```

### 6.3 DNS Configuration

```
# Example DNS records
Type    Name    Value                           TTL
A       @       netlify-ip-address              3600
CNAME   www     your-app.netlify.app            3600
CNAME   api     your-app.railway.app            3600
TXT     @       v=spf1 include:_spf.google.com  3600
```

---

## 7. Monitoring & Logging

### 7.1 Error Tracking (Sentry)

```bash
# Install
npm install @sentry/react @sentry/node

# Initialize frontend (src/main.tsx)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: "production",
  tracesSampleRate: 0.1,
});

# Initialize backend (server/src/index.ts)
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: "production",
});
```

### 7.2 Uptime Monitoring

**Options:**
- UptimeRobot (Free, 50 monitors)
- Pingdom
- Checkly
- StatusCake

**Setup:**
```
Monitor 1: https://your-domain.com (5min interval)
Monitor 2: https://api.your-domain.com/health (5min interval)
Alert: Email/SMS when down
```

### 7.3 Performance Monitoring

**Lighthouse CI:**
```bash
npm install -g @lhci/cli

# Run audit
lhci autorun --collect.url=https://your-domain.com
```

---

## 8. Backup Strategy

### 8.1 Database Backups

**Automated (Railway):**
```bash
# Railway provides automatic daily backups
# Retention: 7 days (Starter), 30 days (Pro)

# Manual backup
railway run pg_dump $DATABASE_URL > backup.sql
```

**Automated (Render):**
```bash
# Configure in dashboard
# Backups > Enable automatic backups
# Frequency: Daily
# Retention: 30 days
```

**Manual Script:**
```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp ${BACKUP_FILE}.gz s3://itson-backups/

# Keep only last 30 backups
aws s3 ls s3://itson-backups/ | sort | head -n -30 | \
  awk '{print $4}' | xargs -I {} aws s3 rm s3://itson-backups/{}

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### 8.2 Cron Job

```bash
# Add to crontab
0 2 * * * /path/to/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

---

## 9. Post-Deployment

### 9.1 Smoke Tests

```bash
# Backend health check
curl https://api.your-domain.com/health

# Frontend load
curl https://your-domain.com

# Login flow
curl -X POST https://api.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@itsonfsm.com","password":"password123"}'

# Database connectivity
curl https://api.your-domain.com/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 9.2 User Acceptance Testing

**Critical Flows:**
- [ ] Login with admin account
- [ ] Create new user from admin panel
- [ ] Send onboarding invite
- [ ] Create task and assign to user
- [ ] Check-in with biometric
- [ ] Upload document
- [ ] View reports
- [ ] Test offline mode
- [ ] Verify WhatsApp webhook

### 9.3 Performance Testing

```bash
# Load test with Apache Bench
ab -n 1000 -c 10 https://your-domain.com/

# Or use Lighthouse
npx lighthouse https://your-domain.com --view

# Check bundle size
npm run build
du -sh dist/

# Analyze bundle
npm run build -- --analyze
```

### 9.4 Security Audit

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check SSL rating
curl https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com

# Check headers
curl -I https://your-domain.com
# Should include:
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - Strict-Transport-Security
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed and merged
- [ ] Database migrations tested
- [ ] Environment variables documented
- [ ] SSL certificates ready
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Load testing completed

### Deployment
- [ ] Database deployed and migrated
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] DNS configured
- [ ] SSL enabled
- [ ] Environment variables set
- [ ] Health checks passing

### Post-Deployment
- [ ] Smoke tests completed
- [ ] User acceptance testing done
- [ ] Performance metrics acceptable
- [ ] Error tracking working
- [ ] Uptime monitoring active
- [ ] Backups running
- [ ] Documentation updated
- [ ] Team notified

---

## Rollback Procedure

If deployment fails:

```bash
# Netlify
netlify rollback

# Railway
railway rollback

# Heroku
heroku releases
heroku rollback v123

# Database rollback
npm run migrate:rollback
```

---

## Maintenance Windows

Schedule regular maintenance:

1. **Weekly:**
   - Review error logs
   - Check uptime reports
   - Verify backups

2. **Monthly:**
   - Update dependencies
   - Security patches
   - Performance review
   - Backup restoration test

3. **Quarterly:**
   - Security audit
   - Load testing
   - Disaster recovery drill
   - User feedback review

---

## Support & Resources

- **Documentation:** /docs
- **Status Page:** status.your-domain.com
- **Admin Email:** admin@itsonfsm.com
- **Support Email:** support@itsonfsm.com
- **Emergency Contact:** +27 XX XXX XXXX

---

## Troubleshooting

### Backend not responding
```bash
# Check logs
railway logs
# or
heroku logs --tail

# Check database connection
railway run psql $DATABASE_URL -c "SELECT 1;"

# Restart service
railway restart
```

### Frontend not loading
```bash
# Check build logs
netlify logs

# Clear cache and redeploy
netlify build --clear-cache
netlify deploy --prod
```

### Database migration failed
```bash
# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:rollback

# Try again
npm run migrate:latest
```

---

**Last Updated:** 2026-02-05
**Platform Version:** 1.0.0
**Maintained by:** ITSON Development Team
