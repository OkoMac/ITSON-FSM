# Google Play Store Deployment Guide

Complete guide for deploying ITSON FSM as a Trusted Web Activity (TWA) app on Google Play Store.

---

## Prerequisites

- Google Play Console account ($25 one-time fee)
- Android Studio installed
- JDK 17 or higher
- Your production PWA deployed and accessible via HTTPS
- Valid SSL certificate (Let's Encrypt is fine)

---

## Step 1: Configure Your Domain

### 1.1 Update Build Configuration

Edit `android/app/build.gradle`:

```gradle
manifestPlaceholders = [
    hostName: "your-production-domain.com",
    defaultUrl: "https://your-production-domain.com",
    launcherName: "ITSON FSM"
]
```

### 1.2 Update Package Name

In `android/app/build.gradle`, set your unique package:

```gradle
applicationId "com.itsonfsm.app"  // Change to your organization
```

---

## Step 2: Generate Digital Asset Links

### 2.1 Generate Keystore

```bash
keytool -genkey -v \
  -keystore itson-release-key.keystore \
  -alias itson-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Enter your organization details when prompted
# SAVE THE PASSWORD - You'll need it for every release
```

### 2.2 Get SHA-256 Fingerprint

```bash
keytool -list -v \
  -keystore itson-release-key.keystore \
  -alias itson-key

# Copy the SHA256 fingerprint (looks like: AB:CD:EF:12:34:...)
```

### 2.3 Update Asset Links

Edit `public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.itsonfsm.app",
      "sha256_cert_fingerprints": [
        "AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12"
      ]
    }
  }
]
```

### 2.4 Deploy Asset Links

Deploy your updated PWA with the assetlinks.json file. Verify it's accessible:

```bash
curl https://your-domain.com/.well-known/assetlinks.json
```

---

## Step 3: Build Release APK/AAB

### 3.1 Configure Signing

Create `android/app/keystore.properties`:

```properties
storeFile=../../itson-release-key.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=itson-key
keyPassword=YOUR_KEY_PASSWORD
```

**⚠️ NEVER COMMIT THIS FILE TO GIT**

### 3.2 Update build.gradle

Add signing configuration to `android/app/build.gradle`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

android {
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
        }
    }
}
```

### 3.3 Build App Bundle

```bash
cd android
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab
```

---

## Step 4: Prepare Play Store Assets

### 4.1 Required Assets

Create the following in `play-store-assets/`:

**App Icons:**
- `icon-512.png` (512x512px, PNG)
- `icon-192.png` (192x192px, PNG)
- Adaptive icon layers (optional)

**Screenshots (at least 2 required per category):**
- Phone: 1080x1920px or 1080x2340px
- 7-inch tablet: 1536x2048px
- 10-inch tablet: 2048x2732px

**Feature Graphic:**
- `feature-graphic.png` (1024x500px, PNG or JPG)

**Privacy Policy:**
- Host at: `https://your-domain.com/privacy-policy`

### 4.2 Screenshot Tips

Capture actual app screens:
1. Login page
2. Dashboard
3. Check-in page
4. Task management
5. Admin panel
6. WhatsApp onboarding

Use Android emulator or real device with 1080x1920 resolution.

---

## Step 5: Create Play Console Listing

### 5.1 Create New App

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in:
   - App name: **ITSON FSM**
   - Default language: **English (United States)**
   - App type: **App**
   - Free/Paid: **Free**

### 5.2 Store Listing

**App Details:**
- Short description (80 chars):
  ```
  Field Service Management platform for South African enterprises and IDC projects
  ```

- Full description (4000 chars):
  ```
  ITSON FSM is a comprehensive field service management platform designed for
  South African enterprises, with special focus on Industrial Development
  Corporation (IDC) compliance requirements.

  KEY FEATURES:

  ✅ WhatsApp Onboarding
  Complete worker registration via WhatsApp Business API with 15-stage verification
  including POPIA consent and Code of Conduct signing.

  ✅ Biometric Authentication
  Face recognition check-in with 80%+ accuracy for secure attendance tracking.

  ✅ Offline-First Architecture
  Work without internet connectivity - all data syncs automatically when online.

  ✅ Comprehensive Task Management
  Assign, track, and approve tasks with real-time status updates.

  ✅ Admin Control Panel
  Manage users, teams, sites, and onboarding invitations from one dashboard.

  ✅ Enterprise Features
  - Document uploads and management
  - PPE tracking and compliance
  - Incident reporting
  - Work schedule management
  - Monthly reports and analytics
  - Training pathways
  - Mentorship programs
  - Reference letter generation

  ✅ IDC Compliance
  Built-in compliance with Industrial Development Corporation requirements
  including audit logging, data retention, and reporting standards.

  SECURITY & PRIVACY:
  - End-to-end encryption
  - POPIA compliant
  - Regular security audits
  - Biometric data stored as non-reversible templates
  - Role-based access control

  SUPPORT:
  Email: support@itsonfsm.com
  Website: https://itsonfsm.com

  Perfect for: Construction, Security, Property Management, Facilities,
  Cleaning Services, and any field-based workforce.
  ```

**Graphics:**
- Upload all screenshots
- Upload feature graphic
- Upload app icon

**Categorization:**
- App category: **Business**
- Tags: productivity, field service, workforce management

**Contact Details:**
- Email: support@itsonfsm.com
- Phone: +27 XX XXX XXXX (optional)
- Website: https://itsonfsm.com

**Privacy Policy:**
- URL: https://your-domain.com/privacy-policy

### 5.3 Content Rating

Complete the questionnaire:
- Select "No" for violence, sexual content, etc.
- Select "Yes" for collection of location data
- Select "Yes" for use of device permissions (camera, location)

### 5.4 Target Audience

- Target age: **18+** (workplace app)
- Ads: **No ads** (unless you plan to add them)

---

## Step 6: Release Management

### 6.1 Create Internal Testing Track

1. Go to **Testing** > **Internal testing**
2. Create new release
3. Upload `app-release.aab`
4. Add release notes:
   ```
   Initial release v1.0.0
   - WhatsApp onboarding
   - Biometric check-in
   - Task management
   - Offline sync
   - Admin panel
   ```
5. Add testers (up to 100 emails)
6. Save and review

### 6.2 Internal Testing (1-2 weeks)

- Test all features thoroughly
- Fix any crashes or bugs
- Update AAB and push new versions

### 6.3 Closed Testing (Optional)

- Expand to 50-100 testers
- Test for 2-4 weeks
- Gather feedback

### 6.4 Open Testing (Optional)

- Public beta with up to 10,000 users
- Soft launch in South Africa only
- Monitor crash reports

### 6.5 Production Release

1. Go to **Production** track
2. Create new release
3. Upload final `app-release.aab`
4. Set rollout percentage: **Start at 5%**
5. Monitor for 24 hours
6. Increase to 25%, then 50%, then 100%

---

## Step 7: Post-Launch

### 7.1 Monitor Metrics

- Crashes & ANRs (Application Not Responding)
- User ratings and reviews
- Install/uninstall rates
- Active users

### 7.2 Update Strategy

```bash
# For each new version:
1. Update versionCode in build.gradle (increment by 1)
2. Update versionName (e.g., 1.0.1, 1.1.0, 2.0.0)
3. Build new AAB: ./gradlew bundleRelease
4. Upload to appropriate track (internal/production)
5. Add release notes
6. Staged rollout (5% → 25% → 50% → 100%)
```

### 7.3 Respond to Reviews

- Respond within 24 hours
- Address bugs mentioned in reviews
- Thank users for positive feedback

---

## Troubleshooting

### Common Issues

**1. Asset Links Not Verified**
```bash
# Test verification:
curl -v https://your-domain.com/.well-known/assetlinks.json

# Check for:
- Valid JSON
- HTTPS (not HTTP)
- Correct package name
- Correct SHA-256 fingerprint
```

**2. App Won't Install**
- Check minimum SDK version (21 = Android 5.0)
- Verify APK signature
- Clear Play Store cache

**3. TWA Not Opening**
- Verify Chrome is installed and updated
- Check custom tabs support
- Test in Chrome Beta

**4. Upload Failed**
- Check AAB file size (<150MB)
- Verify app signing configuration
- Enable Google Play App Signing

---

## Automated Build Script

Save as `scripts/build-release.sh`:

```bash
#!/bin/bash
set -e

echo "🔨 Building ITSON FSM Release AAB..."

# Version bump
VERSION_CODE=$(grep versionCode android/app/build.gradle | awk '{print $2}')
NEW_VERSION_CODE=$((VERSION_CODE + 1))

echo "📦 Version: $NEW_VERSION_CODE"

# Update version
sed -i "s/versionCode $VERSION_CODE/versionCode $NEW_VERSION_CODE/" android/app/build.gradle

# Build
cd android
./gradlew clean bundleRelease

echo "✅ Build complete: app/build/outputs/bundle/release/app-release.aab"
echo "📊 Version Code: $NEW_VERSION_CODE"
```

---

## Checklist

Before submitting to Play Store:

- [ ] Asset links deployed and verified
- [ ] All screenshots captured (min 2 per device type)
- [ ] Feature graphic created (1024x500)
- [ ] Privacy policy published and linked
- [ ] Content rating questionnaire completed
- [ ] Store listing texts proofread
- [ ] AAB signed with production keystore
- [ ] Keystore backed up securely (CRITICAL!)
- [ ] App tested on real Android devices
- [ ] All app permissions justified in description
- [ ] Support email configured and monitored
- [ ] Website live and functional
- [ ] Internal testing completed successfully

---

## Timeline

**Week 1-2:**
- Set up Play Console account
- Create keystore and asset links
- Prepare store assets
- Internal testing

**Week 3:**
- Closed testing with team
- Fix reported bugs

**Week 4:**
- Production release (staged rollout)
- Monitor crash reports
- Respond to early reviews

---

## Resources

- [Google Play Console](https://play.google.com/console)
- [TWA Documentation](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Asset Links Generator](https://developers.google.com/digital-asset-links/tools/generator)
- [Play Console Help](https://support.google.com/googleplay/android-developer)

---

## Security Notes

**🔐 CRITICAL - Keep These Safe:**
1. Release keystore file
2. Keystore passwords
3. Play Console account credentials
4. App signing key (Google manages after first upload)

**⚠️ If you lose the keystore:**
- You CANNOT update your app
- You must publish as new app with different package name
- All existing users must uninstall and reinstall

**Backup Strategy:**
1. Store keystore in password manager (1Password, LastPass)
2. Keep encrypted backup on external drive
3. Store in company safe deposit box
4. Use Google Play App Signing (recommended)

---

**Need Help?**
- Play Console Support: https://support.google.com/googleplay/android-developer/answer/7218994
- ITSON Support: support@itsonfsm.com
