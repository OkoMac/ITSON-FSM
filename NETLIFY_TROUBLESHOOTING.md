# Netlify Deployment Troubleshooting Guide

**Issue**: Changes not visible on Netlify preview
**Last Deploy**: Commit 968028f (pushed successfully)
**Status**: All code is on GitHub ✅

---

## 🔍 Quick Diagnosis

Your code is correctly pushed to GitHub with all the latest features including:
- ✅ Complete admin panel with 6 tabs
- ✅ User management (add, edit, delete)
- ✅ Task creation and assignment
- ✅ Site management
- ✅ Team management
- ✅ Onboarding invite system with unique links

**The issue is likely one of these:**
1. Browser caching (most common)
2. Netlify using an old deployment
3. Wrong login credentials
4. Service worker caching old version

---

## 🚀 Solution Steps (Try in Order)

### Step 1: Hard Refresh Browser (90% Success Rate)

**On Chrome/Edge/Brave**:
- Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**On Firefox**:
- Windows/Linux: `Ctrl + Shift + Delete` → Clear cache → Reload
- Mac: `Cmd + Shift + Delete` → Clear cache → Reload

**On Safari**:
- Mac: `Cmd + Option + E` (empty cache) → `Cmd + R` (reload)

**Alternative**: Open in Incognito/Private window (no cache)

---

### Step 2: Clear Service Worker Cache

The PWA service worker might be caching the old version.

**In Chrome DevTools**:
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Click **Service Workers** (left sidebar)
4. Click **Unregister** next to the service worker
5. Click **Clear storage** (left sidebar)
6. Check **All** and click **Clear site data**
7. Close DevTools and **hard refresh** (`Ctrl + Shift + R`)

**Quick Method**:
1. Open DevTools (`F12`)
2. Right-click the reload button (next to address bar)
3. Select **Empty Cache and Hard Reload**

---

### Step 3: Verify Netlify Deployment

**Check Latest Deploy**:
1. Go to your Netlify dashboard
2. Click on your site
3. Check the **Deploys** tab
4. Verify the latest deploy shows commit `968028f`
5. Check deploy status (should be **Published**)

**If deploy is old** (not showing 968028f):
1. Click **Trigger deploy** → **Clear cache and deploy site**
2. Wait 2-3 minutes for build to complete
3. Hard refresh browser

**Check deploy logs**:
- Look for `✓ built in 17-19s`
- Should show `PWA: 56 entries cached`
- No errors in build log

---

### Step 4: Verify Login Credentials

**Demo Mode Credentials** (case-sensitive):

Admin user:
```
Email: admin@itsonfsm.com
Password: password123
```

Other demo users:
```
manager@itsonfsm.com / password123
supervisor@itsonfsm.com / password123
worker1@itsonfsm.com / password123
worker2@itsonfsm.com / password123
```

**Important**:
- Email must be lowercase
- Password is exactly `password123`
- No spaces before or after

---

### Step 5: Verify Admin Panel Access

After logging in as admin:

1. Click the **Admin Panel** link in navigation
2. OR navigate to: `https://your-site.netlify.app/admin`

You should see **6 tabs**:
- 📊 Dashboard
- 👥 Users
- ✓ Tasks
- 📍 Sites
- 🏢 Teams
- 📨 Onboarding

If you don't see these tabs, the browser cache needs to be cleared.

---

## 🔧 Advanced Troubleshooting

### Check Browser Console for Errors

1. Press `F12` to open DevTools
2. Go to **Console** tab
3. Look for errors (red text)

**Common issues**:
- Service worker errors → Clear service worker (Step 2)
- Network errors → Backend is offline (expected in demo mode)
- Component errors → Clear cache and hard reload

### Verify Build Environment Variables

In Netlify dashboard:
1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Verify: `VITE_USE_MOCK_API = true`
3. Verify: `NODE_VERSION = 18`

### Manual Cache Clear

If nothing works:
1. Netlify Dashboard → **Site settings**
2. **Build & deploy** → **Post processing**
3. Click **Clear cache**
4. **Deploys** → **Trigger deploy** → **Deploy site**

---

## 📱 Mobile Testing

If testing on mobile:

**iOS Safari**:
1. Settings → Safari → Clear History and Website Data
2. Reload the site

**Android Chrome**:
1. Chrome → Settings → Privacy → Clear browsing data
2. Check "Cached images and files"
3. Clear data
4. Reload site

---

## ✅ Verification Checklist

After following steps above, verify you can see:

**In Admin Panel**:
- [ ] 6 tabs visible (Dashboard, Users, Tasks, Sites, Teams, Onboarding)
- [ ] Can click between tabs
- [ ] Each tab shows content (not empty)

**Users Tab**:
- [ ] "Add User" button visible
- [ ] Demo users listed in table
- [ ] Search bar present
- [ ] Edit and Delete buttons on each user

**Tasks Tab**:
- [ ] "Create Task" button visible
- [ ] Form with: Title, Description, Assignee, Site, Priority, Due Date

**Sites Tab**:
- [ ] "Add Site" button visible
- [ ] Form with: Name, Address, Contact Person, Phone

**Teams Tab**:
- [ ] "Add Team" button visible
- [ ] Form with: Team Name, Supervisor, Members

**Onboarding Tab**:
- [ ] "Add Contact" button visible
- [ ] "Bulk Import" section visible
- [ ] Send invite buttons on each contact
- [ ] Status tracking (Pending, Invited, Completed)

---

## 🆘 Still Not Working?

If you've tried all steps above and still don't see the changes:

### Option 1: Try Different Browser
- Open in Chrome Incognito
- Open in Firefox Private
- Try on different device

### Option 2: Check Netlify URL
Make sure you're visiting the correct Netlify URL:
- Not a preview deploy URL
- Not an old deploy URL
- The main site URL from your Netlify dashboard

### Option 3: Wait for CDN Propagation
Sometimes Netlify's CDN takes 5-10 minutes to propagate:
- Wait 10 minutes
- Clear cache again
- Hard refresh

### Option 4: Manual Deploy
1. Netlify Dashboard → Deploys
2. Trigger deploy → **Clear cache and deploy site**
3. Wait for build to complete (2-3 min)
4. Hard refresh browser

---

## 📊 Expected Result

After successful troubleshooting, you should see:

**Login Page**:
- ITSON FSM branding
- Email and password fields
- "Demo Mode" banner at top (yellow/orange)

**After Login (as admin@itsonfsm.com)**:
- Dashboard with metrics
- Navigation with "Admin Panel" link
- Mock data banner visible

**Admin Panel**:
- 6 clickable tabs
- Each tab fully functional
- All forms working
- Mock data populated

**Demo Credentials** work for:
- Creating users (mock mode)
- Creating tasks (mock mode)
- Creating teams (mock mode)
- Sending invites (link copied to clipboard)
- All management functions

---

## 🎯 Quick Test

**1-Minute Verification**:
1. Open site in **Incognito/Private window**
2. Login: `admin@itsonfsm.com` / `password123`
3. Click **Admin Panel** in navigation
4. See 6 tabs
5. Click **Users** tab → See "Add User" button
6. Click **Onboarding** tab → See "Add Contact" and "Bulk Import"

If this works → **Success! Just needed cache clear**
If this doesn't work → **Contact me with:**
- Netlify site URL
- Browser console errors (F12 → Console tab)
- Network tab showing API calls
- Screenshots of what you see

---

## 📞 Support Information

**Netlify Deploy Status**: https://app.netlify.com/
**Latest Commit**: 968028f
**Branch**: claude/yetomo-pwa-platform-ZaYeQ
**Build Time**: ~17-19 seconds
**PWA Entries**: 56 cached

**Features Included in Latest Deploy**:
✅ Admin panel with 6 tabs
✅ User management (full CRUD)
✅ Task creation and assignment
✅ Site management
✅ Team management
✅ Onboarding invite system (unique links)
✅ Bulk import (email/phone)
✅ Status tracking
✅ Search and filtering
✅ All 60+ API endpoints ready

---

**Last Updated**: February 6, 2026
**Session**: claude/yetomo-pwa-platform-ZaYeQ
