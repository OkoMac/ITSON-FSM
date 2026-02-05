# 🚀 Netlify Deployment Guide - ITSON FSM Platform

Complete guide for deploying the ITSON FSM Platform to Netlify with mobile PWA optimization.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Deploy](#quick-deploy)
3. [Manual Deploy](#manual-deploy)
4. [Environment Variables](#environment-variables)
5. [Custom Domain](#custom-domain)
6. [SSL Certificate](#ssl-certificate)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before deploying to Netlify, ensure you have:

- ✅ GitHub account
- ✅ Netlify account (free tier works!)
- ✅ Repository pushed to GitHub
- ✅ Node.js 18+ installed locally (for testing)
- ✅ Backend API deployed (or use mock data)

---

## 🎯 Quick Deploy

### Option 1: Deploy Button (Fastest)

1. Click the Deploy to Netlify button:

   [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/OkoMac/ITSON-FSM)

2. Connect your GitHub account
3. Click **Save & Deploy**
4. Wait 2-3 minutes for build to complete
5. Your site is live! 🎉

### Option 2: Netlify CLI (Recommended)

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Navigate to project directory
cd /home/user/ITSON-FSM

# Login to Netlify
netlify login

# Initialize and deploy
netlify init

# Follow the prompts:
# - Create & configure a new site
# - Connect to GitHub repository
# - Choose build command: npm run build
# - Choose publish directory: dist
# - Deploy site
```

---

## 🔧 Manual Deploy

### Step 1: Connect Repository

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** as the provider
4. Authorize Netlify to access your GitHub account
5. Select the **ITSON-FSM** repository

### Step 2: Configure Build Settings

In the deploy settings page:

```
Build command:     npm run build
Publish directory: dist
Base directory:    (leave empty)
```

### Step 3: Advanced Build Settings

Click **Show advanced** and add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_VERSION` | `18` | Node.js version |
| `VITE_API_URL` | `https://api.itsonfsm.com/api` | Your backend API URL |
| `VITE_AI_PROVIDER` | `claude` | AI provider (claude or openai) |
| `VITE_ANTHROPIC_API_KEY` | `sk-ant-...` | Claude API key (optional) |
| `NPM_FLAGS` | `--legacy-peer-deps` | NPM install flags |

### Step 4: Deploy

1. Click **Deploy site**
2. Wait 2-3 minutes for build
3. Your site will be live at: `https://random-name-12345.netlify.app`

---

## 🔐 Environment Variables

### Required Variables

```bash
# Backend API URL (REQUIRED)
VITE_API_URL=https://api.itsonfsm.com/api

# AI Provider (OPTIONAL - defaults to mock if not set)
VITE_AI_PROVIDER=claude
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
```

### How to Add Environment Variables

1. Go to **Site settings** → **Environment variables**
2. Click **Add a variable**
3. Enter key and value
4. Click **Save**
5. Redeploy the site

---

## 🌐 Custom Domain

### Add Your Domain

1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Enter your domain: `itsonfsm.com`
4. Click **Verify**

### Configure DNS

Add these DNS records at your domain registrar:

#### For Apex Domain (itsonfsm.com)

```
Type: A
Name: @
Value: 75.2.60.5
```

Or use ALIAS/ANAME:

```
Type: ALIAS/ANAME
Name: @
Value: apex-loadbalancer.netlify.com
```

#### For Subdomain (www.itsonfsm.com)

```
Type: CNAME
Name: www
Value: your-site-name.netlify.app
```

### Wait for DNS Propagation

- DNS changes can take 1-48 hours to propagate
- Check status: [DNS Checker](https://dnschecker.org)

---

## 🔒 SSL Certificate

Netlify automatically provisions SSL certificates for all sites.

### Enable HTTPS

1. Go to **Site settings** → **Domain management**
2. Under **HTTPS**, click **Verify DNS configuration**
3. Once verified, click **Provision certificate**
4. Wait 1-2 minutes
5. HTTPS will be enabled automatically

### Force HTTPS

Enable automatic HTTPS redirect:

1. Go to **Site settings** → **Domain management**
2. Under **HTTPS**, toggle **Force HTTPS**
3. All HTTP traffic will redirect to HTTPS

---

## 📱 Post-Deployment

### 1. Test Your Deployment

Visit your site and test these features:

```bash
# Your Netlify URL
https://your-site-name.netlify.app

# Test login
Email: admin@itsonfsm.com
Password: password123

# Test PWA
- Add to home screen (mobile)
- Check offline functionality
- Test biometric check-in
- Verify camera/location permissions
```

### 2. Mobile Testing

**iOS Safari:**
1. Open site in Safari
2. Tap Share button
3. Tap **Add to Home Screen**
4. Launch from home screen
5. Should open in fullscreen (no browser UI)

**Android Chrome:**
1. Open site in Chrome
2. Tap menu (⋮)
3. Tap **Add to Home screen**
4. Launch from home screen
5. Should open in fullscreen

### 3. Verify PWA Features

Use Lighthouse to audit your PWA:

```bash
# Run Lighthouse audit
npx lighthouse https://your-site-name.netlify.app --view

# Check PWA score
# Target: 90+ for all categories
```

### 4. Configure Webhooks (Optional)

Set up deploy hooks for automatic deployments:

1. Go to **Site settings** → **Build & deploy**
2. Scroll to **Build hooks**
3. Click **Add build hook**
4. Name: "Deploy on backend update"
5. Copy webhook URL
6. Use in backend CI/CD

---

## 🔧 Continuous Deployment

Netlify automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Netlify will automatically:
# 1. Detect the push
# 2. Run npm run build
# 3. Deploy to production
# 4. Send notification
```

### Deploy Previews

Every pull request gets a unique preview URL:

```bash
# Create a branch
git checkout -b feature/new-feature

# Push changes
git push origin feature/new-feature

# Create PR on GitHub
# Netlify will comment with preview URL:
# https://deploy-preview-123--your-site.netlify.app
```

---

## 🐛 Troubleshooting

### Build Fails

**Error:** `npm ERR! peer dependencies`

**Solution:** Ensure `NPM_FLAGS` is set to `--legacy-peer-deps`

```bash
# In Netlify environment variables
NPM_FLAGS = --legacy-peer-deps
```

---

**Error:** `Module not found: Can't resolve '@tanstack/react-query'`

**Solution:** Clear cache and redeploy

```bash
# In Netlify UI:
1. Go to Deploys
2. Click "Trigger deploy"
3. Select "Clear cache and deploy"
```

---

**Error:** `Build exceeded maximum allowed runtime`

**Solution:** Optimize build time

```bash
# In package.json, add:
"engines": {
  "node": "18.x",
  "npm": "9.x"
}
```

---

### Site Loads Blank Page

**Check 1:** Verify build output

```bash
# The dist folder should contain:
dist/
  ├── index.html
  ├── assets/
  │   ├── index-[hash].js
  │   └── index-[hash].css
  ├── manifest.json
  └── icons/
```

**Check 2:** Check console errors

```bash
# Open browser console (F12)
# Look for errors like:
# - 404 on assets
# - CORS errors
# - API connection issues
```

**Solution:** Ensure publish directory is `dist`, not `build`

---

### PWA Not Installing

**Check 1:** Verify manifest.json is accessible

```bash
# Visit:
https://your-site.netlify.app/manifest.json

# Should return JSON, not 404
```

**Check 2:** Verify HTTPS is enabled

```bash
# PWA requires HTTPS
# Check site URL starts with https://
```

**Check 3:** Run Lighthouse PWA audit

```bash
npx lighthouse https://your-site.netlify.app --view

# Check PWA category
# Should have "Installable" badge
```

---

### API Connection Issues

**Error:** `Failed to fetch` or `Network error`

**Solution:** Update VITE_API_URL

```bash
# In Netlify environment variables:
VITE_API_URL = https://api.itsonfsm.com/api

# NOT localhost or 127.0.0.1
```

**Enable CORS on backend:**

```typescript
// server/src/index.ts
app.use(cors({
  origin: [
    'https://your-site.netlify.app',
    'https://itsonfsm.com'
  ],
  credentials: true
}));
```

---

### Performance Issues

**Optimize images:**

```bash
# Install image optimization plugin
npm install --save-dev @netlify/plugin-nextgen

# Add to netlify.toml
[[plugins]]
  package = "@netlify/plugin-nextgen"
```

**Enable caching:**

Already configured in `netlify.toml`:

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## 📊 Monitoring

### Netlify Analytics

Enable built-in analytics:

1. Go to **Site settings** → **Analytics**
2. Click **Enable Analytics**
3. View traffic, performance, and errors

### Uptime Monitoring

Use external monitoring (free tier):

- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://pingdom.com)
- [StatusCake](https://statuscake.com)

---

## 🎉 You're Live!

Your ITSON FSM Platform is now deployed on Netlify!

### Next Steps

1. ✅ Share the URL with your team
2. ✅ Test all features thoroughly
3. ✅ Set up custom domain
4. ✅ Enable HTTPS
5. ✅ Monitor site performance
6. ✅ Deploy backend API
7. ✅ Update environment variables
8. ✅ Test PWA installation on mobile

---

## 📞 Support

- **Netlify Docs:** https://docs.netlify.com
- **Netlify Support:** https://netlify.com/support
- **Community Forum:** https://answers.netlify.com

---

## 🔗 Useful Links

- [Netlify Dashboard](https://app.netlify.com)
- [Build Logs](https://app.netlify.com/sites/YOUR-SITE/deploys)
- [Site Settings](https://app.netlify.com/sites/YOUR-SITE/settings)
- [Environment Variables](https://app.netlify.com/sites/YOUR-SITE/settings/deploys#environment)
- [Domain Management](https://app.netlify.com/sites/YOUR-SITE/settings/domain)

---

**Deployment Status:** 🟢 Ready for Production

**Built with:** React 18 + TypeScript + Vite + Tailwind CSS

**Optimized for:** Mobile PWA + iOS + Android

**Session:** https://claude.ai/code/session_2f89178d-02af-4820-a065-4247730bb6de
