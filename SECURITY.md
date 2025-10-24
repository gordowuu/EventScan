# EventSnap - Security & Configuration Guide

## 🔒 Security Best Practices

### Current Status
Your app currently has API keys hardcoded in the source code. While Firebase client config is safe to expose (when security rules are properly configured), it's better practice to use environment variables.

### Recommended Security Improvements

#### 1. **Firebase Security Rules**
Make sure your Firebase project has proper security rules configured:

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Deny all direct database access from client
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if false; // All access through functions only
    }
  }
}
```

#### 2. **Protect Your Gemini API Key**
The GEMINI_API_KEY is already properly secured using Firebase Secrets. Good job! ✅

To update it:
```bash
firebase functions:secrets:set GEMINI_API_KEY
```

#### 3. **Secure OAuth Client ID**
Your Google OAuth Client ID should be:
- Restricted to your domain only
- Have authorized redirect URIs configured
- Use the principle of least privilege (only calendar.events scope)

Configure at: https://console.cloud.google.com/apis/credentials

#### 4. **Rate Limiting** (Recommended)
Add rate limiting to your Firebase Function to prevent abuse:

```javascript
// In functions/index.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
});
```

#### 5. **Input Validation**
Already implemented in the updated code! ✅
- Image size validation (4MB limit)
- File type validation (JPG/PNG only)
- Proper error handling

---

## 🚀 Deployment Checklist

### Before Deploying to Production:

- [ ] Set up Firebase Security Rules (Firestore & Storage)
- [ ] Configure OAuth consent screen and authorized domains
- [ ] Set GEMINI_API_KEY secret: `firebase functions:secrets:set GEMINI_API_KEY`
- [ ] Test error handling with invalid inputs
- [ ] Set up Firebase App Check (protects against abuse)
- [ ] Configure CORS properly for your domain
- [ ] Enable Firebase Analytics & Monitoring
- [ ] Test on multiple devices and browsers
- [ ] Set up backup/monitoring for function errors

### Deploying Functions:
```bash
# Deploy only functions
firebase deploy --only functions

# Deploy everything
firebase deploy

# View logs
firebase functions:log
```

---

## 🔐 API Key Management

### What's Safe to Expose:
✅ Firebase Client Config (apiKey, authDomain, etc.)
✅ Google OAuth Client ID (for your domain)
✅ Public Firebase Project ID

### What Must Stay Secret:
❌ GEMINI_API_KEY (stored in Firebase Secrets)
❌ Firebase Admin SDK Service Account Keys
❌ OAuth Client Secrets
❌ Database connection strings

### Current Implementation:
- ✅ GEMINI_API_KEY: Secured via Firebase Secrets
- ⚠️ Firebase Config: Hardcoded (acceptable but use env vars for cleaner code)
- ⚠️ OAuth Client ID: Hardcoded (should restrict to your domain)

---

## 🛡️ Firebase App Check (Highly Recommended)

Protect your app from abuse by enabling App Check:

1. Go to Firebase Console → App Check
2. Enable App Check for your web app
3. Use reCAPTCHA v3 for production
4. Update your code:

```javascript
// Add to your Firebase initialization
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
  isTokenAutoRefreshEnabled: true
});
```

---

## 📊 Monitoring & Logging

Monitor your app's health:

```bash
# View function logs
firebase functions:log

# View specific function
firebase functions:log --only parseEventImage

# Real-time logs
firebase functions:log --tail
```

Set up Cloud Monitoring alerts for:
- Function errors exceeding threshold
- High latency (>10 seconds)
- Quota usage approaching limits

---

## 💰 Cost Management

### Current Usage Estimates:
- **Gemini API**: ~$0.075 per 1,000 images (1.5 Flash)
- **Firebase Functions**: Free tier covers ~2M invocations/month
- **Firebase Hosting**: Free tier covers ~10GB/month

### Tips to Reduce Costs:
1. ✅ Image compression (already implemented)
2. ✅ Use Flash model instead of Pro (already implemented)
3. Add caching for repeated images
4. Set up billing alerts in Google Cloud Console

---

## 🧪 Testing

Test your security:

```bash
# Test with invalid image
curl -X POST [your-function-url] -d '{"data":{"imageData":"invalid"}}'

# Test with oversized payload
# Should return error

# Test rate limiting
# Multiple rapid requests should be blocked
```

---

## 📝 Compliance

If collecting user data:
- ✅ Privacy Policy (already have /privacy.html)
- Consider GDPR compliance if EU users
- Add cookie consent if using analytics
- Disclose AI usage in terms of service

---

## 🆘 Troubleshooting

### "CORS Error"
Make sure `cors: true` is set in your functions and your domain is authorized.

### "Quota Exceeded"
Check your Gemini API quotas at: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

### "Permission Denied"
Review Firebase Security Rules and App Check configuration.

### "Function Timeout"
Increase timeout in function configuration:
```javascript
{
  timeoutSeconds: 60,  // Increase if needed
  memory: "512MiB"     // Increase if processing large images
}
```

---

## 📚 Additional Resources

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [Gemini API Docs](https://ai.google.dev/docs)
- [OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/web-server)
