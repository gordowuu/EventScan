# EventSnap - Quick Reference Guide

## 🎯 Common Tasks

### Initial Setup (First Time Only)

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Select your project
firebase use --add

# 4. Set Gemini API key
firebase functions:secrets:set GEMINI_API_KEY

# 5. Install function dependencies
cd functions && npm install && cd ..

# 6. Deploy
firebase deploy
```

### Regular Deployment

```bash
# Deploy everything
firebase deploy

# Deploy only functions (when you change backend code)
firebase deploy --only functions

# Deploy only hosting (when you change frontend code)
firebase deploy --only hosting
```

### Monitoring & Debugging

```bash
# View real-time logs
firebase functions:log --tail

# View specific function logs
firebase functions:log --only parseEventImage

# Check deployed functions
firebase functions:list

# View last 10 log entries
firebase functions:log --limit 10
```

### Testing Locally

```bash
# Start local emulator
firebase emulators:start

# Your app will be at: http://localhost:5000
# Functions will be at: http://localhost:5001
```

### Updating Dependencies

```bash
# Update function dependencies
cd functions
npm update
npm audit fix
cd ..

# Redeploy after updating
firebase deploy --only functions
```

## 🔧 Configuration Updates

### Update Firebase Config

**File:** `public/script.js`

Find and replace:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  // ... rest of config
};
```

### Update OAuth Client ID

**File:** `public/script.js`

Find and replace:
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
```

### Update Gemini Model

**File:** `functions/index.js`

Find and change the model:
```javascript
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest", // or "gemini-1.5-pro-latest"
});
```

Then redeploy:
```bash
firebase deploy --only functions
```

## 🐛 Troubleshooting Quick Fixes

### "Function not found" error

```bash
# Redeploy functions
firebase deploy --only functions

# Verify deployment
firebase functions:list
```

### "CORS error" in browser

**Check:**
1. Function has `cors: true` (already configured)
2. Deploy completed successfully
3. Clear browser cache

**Fix:**
```bash
firebase deploy --only functions
# Then hard-refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### "Permission denied" for API

**Check:**
1. Gemini API key is set
2. Calendar API is enabled

**Fix:**
```bash
# Verify secret
firebase functions:secrets:access GEMINI_API_KEY

# If empty, set it
firebase functions:secrets:set GEMINI_API_KEY
```

### High costs or quota errors

**Check usage:**
1. Go to [Cloud Console](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas)
2. View current quota and usage

**Reduce costs:**
- Implement caching (future enhancement)
- Add rate limiting
- Review image compression settings

### Function timeout

**Increase timeout** in `functions/index.js`:
```javascript
exports.parseEventImage = onRequest({
  timeoutSeconds: 120,  // Increase from 60
  memory: "1GiB"        // Increase if needed
}, ...);
```

Redeploy: `firebase deploy --only functions`

## 📊 Checking App Health

### Quick Health Check

```bash
# 1. Check if site is up
curl https://YOUR_PROJECT.web.app

# 2. Check function deployment
firebase functions:list

# 3. View recent errors
firebase functions:log --limit 20 | grep ERROR

# 4. Check secret is set
firebase functions:secrets:access GEMINI_API_KEY
```

### Performance Monitoring

**View in Firebase Console:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to: Functions → Dashboard
4. Check:
   - Invocation count
   - Error rate (should be < 5%)
   - Execution time (should be < 10s average)
   - Memory usage

## 🔄 Update Checklist

When making changes:

**Frontend changes** (HTML, CSS, JS):
- [ ] Edit files in `public/`
- [ ] Test locally: `firebase serve`
- [ ] Deploy: `firebase deploy --only hosting`

**Backend changes** (Functions):
- [ ] Edit `functions/index.js`
- [ ] Test locally: `firebase emulators:start`
- [ ] Deploy: `firebase deploy --only functions`
- [ ] Check logs: `firebase functions:log --tail`

**Configuration changes**:
- [ ] Update `firebase.json` or `.env`
- [ ] Deploy: `firebase deploy`
- [ ] Verify changes took effect

## 🚨 Emergency Rollback

If deployment breaks something:

```bash
# Rollback hosting
firebase hosting:rollback

# Rollback functions (redeploy previous version)
git log --oneline  # Find previous working commit
git checkout <commit-hash>
firebase deploy --only functions
git checkout main  # Return to latest
```

## 📈 Usage Statistics

### View Function Invocations

```bash
# Recent invocations
firebase functions:log --only parseEventImage --limit 50

# Count errors in last 100 calls
firebase functions:log --limit 100 | grep -c ERROR
```

### Estimate Costs

**Current pricing (as of Oct 2025):**
- Gemini 1.5 Flash: $0.075 per 1,000 images
- Cloud Functions: $0.40 per million invocations
- Firebase Hosting: Free up to 10GB/month

**Example calculation:**
```
1,000 events processed/month:
- Gemini API: $0.075
- Functions: ~$0.001
- Hosting: $0 (under limit)
Total: ~$0.08/month
```

## 🔐 Security Maintenance

### Rotate API Keys (Recommended Quarterly)

```bash
# 1. Generate new Gemini API key at:
# https://makersuite.google.com/app/apikey

# 2. Update secret
firebase functions:secrets:set GEMINI_API_KEY
# Paste new key when prompted

# 3. Redeploy
firebase deploy --only functions

# 4. Delete old key from Google AI Studio
```

### Update OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Update authorized URIs if domain changed
3. No need to redeploy if only URIs changed

## 📝 Quick File Reference

| File | Purpose | Deploy Command |
|------|---------|----------------|
| `functions/index.js` | Backend AI processing | `firebase deploy --only functions` |
| `public/script.js` | Frontend logic | `firebase deploy --only hosting` |
| `public/index.html` | UI layout | `firebase deploy --only hosting` |
| `firebase.json` | Project config | `firebase deploy` |
| `.env` | Local env vars | Not deployed (local only) |

## 🆘 Getting Help

### Check These First:
1. Browser console (F12) for frontend errors
2. Function logs: `firebase functions:log --tail`
3. `SECURITY.md` for configuration issues
4. `DEPLOYMENT.md` for setup problems

### Still Stuck?
- 📖 [Firebase Docs](https://firebase.google.com/docs)
- 🤖 [Gemini API Docs](https://ai.google.dev/docs)
- 💬 [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
- 🐛 [GitHub Issues](https://github.com/gordowuu/EventScan/issues)

## ⚡ Pro Tips

1. **Always test locally first**: `firebase emulators:start`
2. **Watch logs during testing**: `firebase functions:log --tail`
3. **Use staging environment**: Create separate Firebase project for testing
4. **Monitor costs**: Set up billing alerts in Cloud Console
5. **Keep dependencies updated**: Run `npm update` monthly
6. **Backup your config**: Save Firebase config and OAuth credentials securely
7. **Document changes**: Update IMPROVEMENTS.md with significant changes

---

## Quick Commands Cheatsheet

```bash
# Deploy
firebase deploy                          # Everything
firebase deploy --only functions         # Just backend
firebase deploy --only hosting          # Just frontend

# Monitor
firebase functions:log --tail           # Live logs
firebase functions:list                 # List all functions

# Secrets
firebase functions:secrets:set KEY      # Set secret
firebase functions:secrets:access KEY   # View secret

# Local Development
firebase emulators:start                # Start local server
firebase serve                          # Serve hosting only

# Rollback
firebase hosting:rollback               # Undo last hosting deploy

# Info
firebase projects:list                  # List your projects
firebase use                           # Show current project
```

---

**Happy coding! 🚀**
