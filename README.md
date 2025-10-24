# 📸 EventSnap - Smart Event Poster to Calendar

Transform event posters into Google Calendar events instantly using AI vision technology.

![EventSnap Demo](https://img.shields.io/badge/Status-Production%20Ready-success)
![Firebase](https://img.shields.io/badge/Firebase-v10-orange)
![Gemini](https://img.shields.io/badge/Gemini-1.5%20Flash-blue)

## ✨ Features

- 🎯 **AI Vision Processing** - Direct image analysis using Google's Gemini 1.5 Flash
- 📅 **One-Click Calendar Export** - Add events to Google Calendar instantly
- 📱 **Mobile Optimized** - Works perfectly on phones and tablets
- ⚡ **Fast & Efficient** - Image compression and optimized processing
- 🔒 **Secure** - Client-side compression, server-side AI processing
- 💪 **Smart Extraction** - Automatically detects title, date, time, location
- ⚠️ **Confidence Scoring** - Know when to double-check extracted information
- 🎨 **Beautiful UI** - Modern, accessible, and user-friendly design

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Firebase CLI](https://firebase.google.com/docs/cli) installed globally
- Google Cloud account with Gemini API access
- Firebase project with Blaze (pay-as-you-go) plan

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gordowuu/EventScan.git
   cd EventScan
   ```

2. **Install dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

3. **Set up Firebase**
   ```bash
   firebase login
   firebase use --add
   ```

4. **Configure Gemini API Key**
   ```bash
   # Get your key from: https://makersuite.google.com/app/apikey
   firebase functions:secrets:set GEMINI_API_KEY
   ```

5. **Update Firebase configuration**
   - Open `public/script.js`
   - Replace the `firebaseConfig` object with your project's config
   - Update `GOOGLE_CLIENT_ID` with your OAuth Client ID

6. **Deploy**
   ```bash
   firebase deploy
   ```

## 🔧 Configuration

### Firebase Setup

1. **Enable required services:**
   - Firebase Hosting
   - Cloud Functions
   - (Optional) Firebase Analytics

2. **Configure OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 Client ID for Web Application
   - Add authorized redirect URIs
   - Copy Client ID to `public/script.js`

3. **Security Rules:**
   See `SECURITY.md` for recommended Firebase security rules

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

See `.env.example` for all required variables.

## 📖 Usage

1. **Open the app** in your browser
2. **Upload an event poster** (JPG or PNG, up to 4MB)
3. **Review extracted details** - AI will extract title, date, time, location
4. **Edit if needed** - Adjust any details that need correction
5. **Add to Calendar** - Click to add to Google Calendar

### Tips for Best Results

- ✅ Use clear, well-lit photos
- ✅ Ensure text is readable
- ✅ Center the poster in the frame
- ✅ Avoid shadows and glare
- ❌ Don't use extremely low resolution images
- ❌ Avoid images with too much background clutter

## 🏗️ Project Structure

```
eventsnap/
├── functions/           # Firebase Cloud Functions
│   ├── index.js        # Main function (Gemini Vision API)
│   └── package.json    # Function dependencies
├── public/             # Static web files
│   ├── index.html      # Main app UI
│   ├── script.js       # Client-side logic
│   ├── icons/          # PWA icons
│   └── manifest.json   # PWA manifest
├── .env.example        # Environment variable template
├── SECURITY.md         # Security best practices
├── IMPROVEMENTS.md     # Recent improvements log
└── firebase.json       # Firebase configuration
```

## 🔒 Security

This app implements several security measures:

- ✅ Input validation (file type, size)
- ✅ Image compression before upload
- ✅ Server-side API key management (Firebase Secrets)
- ✅ Error handling and rate limiting
- ✅ Secure OAuth flow for Google Calendar

**See `SECURITY.md` for comprehensive security guidelines and best practices.**

## 💰 Cost Estimates

Based on typical usage:

- **Gemini API**: ~$0.075 per 1,000 images processed
- **Firebase Functions**: Free tier covers ~2M invocations/month
- **Firebase Hosting**: Free tier covers ~10GB/month transfer

**Expected cost for 1,000 users/month:** < $5

## 🧪 Testing

### Manual Testing

```bash
# Start local emulator
firebase emulators:start

# Deploy to staging
firebase use staging
firebase deploy
```

### Test Cases

- ✅ Clear event poster → Should extract all details with high confidence
- ✅ Blurry image → Should show warning but still attempt extraction
- ✅ Non-event image → Should handle gracefully with low confidence
- ✅ Oversized file → Should reject with clear error message
- ✅ Invalid file type → Should reject immediately

## 📊 Recent Improvements

**Version 2.0** (October 2025)
- ✨ Switched to Gemini Vision API (removed Tesseract)
- ⚡ 98% reduction in client bundle size
- 🎯 Enhanced error handling and user feedback
- 📱 Improved mobile UX with larger touch targets
- 🔒 Added security documentation and best practices
- 🤖 Upgraded to stable Gemini 1.5 Flash model
- 📊 Added confidence scoring for extractions

See `IMPROVEMENTS.md` for detailed changelog.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) for the AI vision API
- [Firebase](https://firebase.google.com/) for hosting and functions
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

- 📧 Email: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](https://github.com/gordowuu/EventScan/issues)
- 📖 Documentation: See `SECURITY.md` and `IMPROVEMENTS.md`

## 🗺️ Roadmap

- [ ] Support for multiple calendar providers (Outlook, Apple Calendar)
- [ ] Batch processing for multiple posters
- [ ] Dark mode
- [ ] Recurring event detection
- [ ] Multi-language support
- [ ] Offline PWA capabilities
- [ ] Event reminder customization

---

**Made with ❤️ using AI and Firebase**
