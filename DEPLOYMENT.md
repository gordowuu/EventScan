# 🚀 Deployment Guide for EventSnap

## Pre-Deployment Checklist

Before deploying, ensure you have completed:

- [ ] Firebase project created with Blaze plan enabled
- [ ] Gemini API key obtained from [Google AI Studio](https://aistudio.google.com/app/apikey)
- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Logged into Firebase: `firebase login`

## Step-by-Step Deployment

### 1. Set Up Gemini API Key (Required)

```bash
# This stores your key securely in Firebase
firebase functions:secrets:set GEMINI_API_KEY
# When prompted, paste your Gemini API key
```

To verify it's set:
```bash
firebase functions:secrets:access GEMINI_API_KEY
```

### 2. Update Configuration Files

#### Update `public/script.js`:

Replace the Firebase config with your own:

```javascript
// Your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

**Where to find these:**
- Firebase config: [Firebase Console](https://console.firebase.google.com/) → Project Settings → General → Your apps → Web app

### 3. Enable Required APIs

In [Google Cloud Console](https://console.cloud.google.com/apis/library):

- [x] Generative Language API (Gemini)
- [x] Cloud Functions API

```bash
# Or enable via CLI
gcloud services enable generativelanguage.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
```

**Note:** Calendar API is not required - EventSnap uses standard calendar links (no OAuth needed!)

### 4. Deploy Firebase Functions

```bash
# Deploy only functions (recommended for first deployment)
firebase deploy --only functions

# This will:
# - Build your function code
# - Upload to Cloud Functions
# - Set up the parseEventImage endpoint
# - Configure secrets access
```

**Expected output:**
```
✔  Deploy complete!

Functions:
  parseEventImage(us-central1): https://us-central1-YOUR_PROJECT.cloudfunctions.net/parseEventImage
```

### 6. Deploy Hosting

```bash
# Deploy hosting files
firebase deploy --only hosting

# This will:
# - Upload public/ directory
# - Configure routing
# - Deploy to YOUR_PROJECT.web.app
```

**Expected output:**
```
✔  Deploy complete!

Hosting URL: https://YOUR_PROJECT.web.app
```

### 7. Deploy Everything Together (Optional)

For subsequent deployments:

```bash
# Deploy all services at once
firebase deploy

# Or deploy specific services
firebase deploy --only functions,hosting
```

## Post-Deployment Steps

### 1. Test Your Deployment

Visit your hosting URL: `https://YOUR_PROJECT.web.app`

Test these scenarios:
- [ ] Upload a clear event poster
- [ ] Check that AI extraction works
- [ ] Verify Google Calendar integration
- [ ] Test error handling (upload invalid file)
- [ ] Test on mobile device

### 2. Configure Firebase Security Rules

In [Firebase Console](https://console.firebase.google.com/):

**Firestore Rules** (if you add database later):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Access only through functions
    }
  }
}
```

**Storage Rules** (if you add storage later):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if false; // Access only through functions
    }
  }
}
```

### 3. Set Up Monitoring (Recommended)

1. **Enable Firebase Analytics**
   ```bash
   firebase deploy --only functions,hosting
   # Analytics is auto-enabled with measurementId
   ```

2. **Set Up Error Alerts**
   - Go to [Cloud Console Monitoring](https://console.cloud.google.com/monitoring)
   - Create alert for function errors
   - Set threshold: > 5 errors in 5 minutes

3. **Monitor Function Logs**
   ```bash
   # View real-time logs
   firebase functions:log --tail
   
   # View specific function
   firebase functions:log --only parseEventImage
   ```

### 4. Configure App Check (Highly Recommended)

Protect your app from abuse:

1. Go to Firebase Console → App Check
2. Click "Get Started"
3. Choose "reCAPTCHA v3"
4. Register your domain
5. Add to your code:

```javascript
// In public/script.js, after Firebase initialization
import { initializeAppCheck, ReCaptchaV3Provider } from 
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

6. Redeploy:
   ```bash
   firebase deploy --only hosting
   ```

## Troubleshooting

### Issue: "CORS Error"

**Solution:**
The function already has `cors: true`. If you still see errors:

1. Check that your domain is authorized in OAuth settings
2. Clear browser cache
3. Verify function deployed successfully: `firebase functions:list`

### Issue: "Permission Denied" or "Unauthenticated"

**Solution:**
1. Verify Gemini API key is set: `firebase functions:secrets:access GEMINI_API_KEY`
1. Check Firebase function logs: `firebase functions:log`
2. Check that Generative Language API (Gemini) is enabled in Cloud Console
3. Verify Gemini API key is set correctly in Firebase secrets

### Issue: "Function Timeout"

**Solution:**
Function timeout is set to 60s. If you need more:

```javascript
// In functions/index.js
exports.parseEventImage = onRequest({
  timeoutSeconds: 120,  // Increase to 120s
  memory: "1GiB"        // Increase memory if needed
}, async (req, res) => {
  // ...
});
```

Redeploy: `firebase deploy --only functions`

### Issue: "Quota Exceeded"

**Solution:**
1. Check Gemini API quotas: [Console](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas)
2. Request quota increase if needed
3. Implement caching to reduce API calls

### Issue: Image Upload Fails

**Possible causes:**
- Image too large (>4MB)
- Invalid format (not JPG/PNG)
- Network issue

**Check:**
- Browser console for error messages
- Function logs: `firebase functions:log`

## Performance Optimization

### 1. Enable CDN (Automatic with Firebase Hosting)
Firebase Hosting automatically uses Google's CDN. No configuration needed!

### 2. Set Up Caching Headers

In `firebase.json`:
```json
{
  "hosting": {
    "public": "public",
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|png|gif|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=604800"
          }
        ]
      }
    ]
  }
}
```

Redeploy: `firebase deploy --only hosting`

### 3. Monitor Performance

```bash
# Check function performance
firebase functions:log --only parseEventImage

# Look for:
# - Average execution time (should be < 10s)
# - Memory usage (should be < 512MB)
# - Error rate (should be < 1%)
```

## Cost Management

### Set Up Billing Alerts

1. Go to [Google Cloud Console Billing](https://console.cloud.google.com/billing)
2. Click "Budgets & alerts"
3. Create budget:
   - Amount: $10/month (or your preference)
   - Alert at: 50%, 90%, 100%

### Monitor Costs

```bash
# View current usage
firebase functions:log --only parseEventImage | grep "Memory used"

# Estimate costs:
# - Gemini 1.5 Flash: $0.075 per 1,000 images
# - Functions: $0.40 per million invocations
# - Hosting: Free up to 10GB/month
```

## Rolling Back

If something goes wrong:

```bash
# List recent deployments
firebase hosting:releases:list

# Rollback hosting to previous version
firebase hosting:rollback

# For functions, redeploy previous version
git checkout <previous-commit>
firebase deploy --only functions
```

## Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: cd functions && npm install
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

## Maintenance

### Regular Tasks

**Weekly:**
- [ ] Check function logs for errors
- [ ] Review usage and costs
- [ ] Test app functionality

**Monthly:**
- [ ] Update dependencies: `cd functions && npm update`
- [ ] Review and rotate API keys if needed
- [ ] Check for Firebase SDK updates

**Quarterly:**
- [ ] Review security rules
- [ ] Review API usage and costs
- [ ] Update documentation

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Calendar Links Documentation](https://developers.google.com/calendar/api/guides/create-events#calendar-links)
- [Firebase Functions Logs](https://console.firebase.google.com/project/_/functions/logs)
- [Cloud Console](https://console.cloud.google.com/)

---

## Quick Reference Commands

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# View logs
firebase functions:log --tail

# Check function status
firebase functions:list

# Test locally
firebase emulators:start

# Set secret
firebase functions:secrets:set GEMINI_API_KEY

# View secret
firebase functions:secrets:access GEMINI_API_KEY
```

---

**🎉 You're all set! Your EventSnap app is now live and ready to use!**

Having issues? Check `SECURITY.md` and `IMPROVEMENTS.md` or open an issue on GitHub.
