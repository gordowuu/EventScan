# 📸 EventSnap - Smart Event Poster to Calendar

Transform event posters into calendar events instantly using AI vision technology. No OAuth verification needed!

![EventSnap Demo](https://img.shields.io/badge/Status-Production%20Ready-success)
![Firebase](https://img.shields.io/badge/Firebase-v10-orange)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### Core Functionality
- 🤖 **AI Vision Processing** - Google's Gemini 2.5 Flash for advanced image understanding
- 📅 **Multi-Calendar Support** - Export to Google, Apple, Outlook calendars
- 🚀 **No OAuth Required** - Industry-standard calendar links, no verification needed
- 📱 **Mobile Optimized** - PWA-ready with responsive design and mobile-first approach
- ⚡ **Fast & Efficient** - Automatic image compression and optimization
- 🔒 **Privacy First** - No data storage, client-side processing

### Smart Features
- 💪 **Advanced Extraction** - Detects title, date, time, location, description
- 🔁 **Recurring Events** - Identifies and configures repeat patterns with RRULE support
- 🎟️ **Registration Info** - Extracts URLs, prices, deadlines
- 👤 **Organizer Details** - Captures contact info and websites
- 🌍 **Multi-Language** - Supports events in any language
- ⚠️ **Confidence Scoring** - Visual field-level indicators show extraction reliability

### User Experience
- 🎨 **Futuristic Dark UI** - Beautiful glassmorphism design with purple/pink gradient theme
- ✨ **Animated Background** - Particle.js effects and neon glow elements
- 📋 **Drag & Drop** - Upload by dragging files
- 📎 **Paste Support** - Paste images directly from clipboard
- 📸 **Smart Camera Access** - Choose between camera, gallery, or files on mobile
- 🔄 **Auto-Update** - Automatic app updates without cache clearing
- 💾 **Smart Preferences** - Remembers your calendar choice
- 🔁 **Error Recovery** - Retry failed extractions with one click
- 🎯 **Field Confidence** - Yellow/red badges for uncertain fields with dark-themed indicators
- � **Permanently Dark** - Optimized dark theme for reduced eye strain
- ♿ **Accessible** - WCAG AA compliant

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
   # Get your key from: https://aistudio.google.com/app/apikey
   firebase functions:secrets:set GEMINI_API_KEY
   ```

5. **Update Firebase configuration**
   - Open `public/script.js`
   - Replace the `firebaseConfig` object with your project's config

6. **Deploy**
   ```bash
   firebase deploy
   ```

## 🔧 Configuration

### Firebase Setup

1. **Enable required services:**
   - Firebase Hosting
   - Cloud Functions (Node.js 20, Gen 2)
   - Secret Manager (for API keys)
   - (Optional) Firebase Analytics

2. **Configure Function:**
   - Region: us-central1
   - Memory: 512MB
   - Timeout: 60s
   - Runtime: Node.js 20

3. **Security:**
   - API keys stored in Firebase Secret Manager
   - No OAuth verification needed (using calendar links)
   - HTTPS-only hosting with proper cache headers

### API Configuration

Set up your Gemini API key as a Firebase secret:

```bash
# Get API key from Google AI Studio
firebase functions:secrets:set GEMINI_API_KEY

# Enter your key when prompted
```

No other environment variables needed!

## 📖 Usage

1. **Visit** [event-snap.web.app](https://event-snap.web.app)
2. **Upload an event poster**
   - Click to browse, drag & drop, or paste from clipboard
   - Supports JPG/PNG, up to 4MB
3. **Review extracted details**
   - AI extracts title, date, time, location, and more
   - Confidence indicator shows extraction quality
4. **Edit if needed** - Adjust any details
5. **Add to Calendar**
   - Choose from 4 calendar providers (Google, Apple, Outlook, Yahoo)
   - Event opens pre-filled in your calendar
   - Click "Save" to add

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
├── functions/              # Firebase Cloud Functions
│   ├── index.js           # AI processing with Gemini 2.5 Flash
│   └── package.json       # Function dependencies
├── public/                # Static web files
│   ├── index.html         # Main app UI (futuristic dark glassmorphism design)
│   ├── script.js          # Client-side logic & calendar integration
│   ├── sw.js              # Service Worker for PWA & auto-updates
│   ├── manifest.json      # PWA manifest
│   ├── privacy.html       # Privacy Policy
│   ├── terms.html         # Terms of Service
│   ├── index-original.html # Original UI backup
│   ├── script-original.js  # Original script backup
│   └── icons/             # PWA icons (144x144, 192x192, 512x512)
├── firebase.json          # Firebase config with cache headers
├── SECURITY.md            # Security guidelines
├── EXPERIMENTAL_REVIEW.md # UI redesign documentation
└── README.md              # You are here
```

## 🔒 Security & Privacy

### Security Measures
- ✅ Input validation (file type, size limits)
- ✅ Automatic image compression before upload
- ✅ Server-side API key management (Firebase Secret Manager)
- ✅ Comprehensive error handling
- ✅ HTTPS-only hosting
- ✅ No OAuth permissions required

### Privacy Features
- 🔒 **No Data Storage** - Images and event data are NOT stored
- 🔒 **No User Accounts** - No sign-up or login required
- 🔒 **No Tracking** - Minimal analytics, no personal data collection
- 🔒 **Client-Side Processing** - Image compression happens in your browser
- 🔒 **Temporary Processing** - Server processes images in memory only

**See `SECURITY.md` for detailed security guidelines.**

## 💰 Cost Estimates

Based on Gemini 2.0 Flash pricing (October 2025):

### API Costs
- **Input**: $0.075 per 1M tokens (~$0.000125 per image)
- **Output**: $0.30 per 1M tokens (~$0.000045 per image)
- **Total per image**: ~$0.00017 - $0.00032

### Firebase Costs
- **Functions**: Free tier covers 2M invocations/month
- **Hosting**: Free tier covers 10GB/month transfer
- **Bandwidth**: Free tier covers 360MB/day

### Real-World Examples
- **100 images/month**: $0.02 (essentially free)
- **1,000 images/month**: $0.17 - $0.32
- **10,000 images/month**: $1.70 - $3.20
- **100,000 images/month**: $17 - $32

**Free tier covers ~15,000 images per month!** 🎉

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

## 📊 Recent Updates

### Version 4.0 (November 2025) 🎨 **Major UI/UX Redesign**

**Complete Visual Overhaul**
- 🎨 **Futuristic Dark Theme** - Stunning purple/pink gradient color scheme
- ✨ **Particle Effects** - Animated background with particle.js integration
- 💎 **Enhanced Glassmorphism** - Darker glass effects with neon borders
- 🌈 **Holographic Text** - White-to-cyan gradient for maximum visibility
- 🎯 **3D Card Effects** - Depth and hover animations throughout
- 🔮 **Neon Glow** - Subtle glow effects on key elements
- 📱 **Mobile-First Redesign** - Optimized layouts and touch interactions

**Improved User Flow**
- 📸 **Better Image Positioning** - Poster appears above form on mobile for easy reference
- 🕐 **Fixed DateTime Inputs** - No more overflow on mobile screens
- 🎨 **Themed Success Page** - Calendar opened page matches dark design
- 🔗 **GitHub Integration** - Direct link to repository in footer
- ⬆️ **Smart Scrolling** - Auto-scroll to top when navigating back
- 🎯 **Centered Layouts** - All form elements properly aligned

**UI Refinements**
- 🎨 **Dark Confidence Indicators** - Yellow/red badges with dark backgrounds for readability
- 📅 **Inverted Calendar Icons** - White datetime picker icons for visibility
- 🌑 **Dark Mode Only** - Removed toggle for consistent experience
- 💜 **Unified Theme** - Calendar modal matches main site design
- 📝 **Visible Text Gradients** - All text uses high-contrast holographic effects

**Technical Improvements**
- ⚡ **Proper DOM Loading** - Fixed click handlers with window.onload
- 🔧 **Removed Capture Attribute** - Mobile users can choose upload method
- 📱 **Responsive Grid** - DateTime inputs stack on mobile, side-by-side on desktop
- 🎨 **CSS Optimizations** - Improved glass effects and animations

### Version 3.1 (October 31, 2025) 🎃

**UX Improvements & Polish**
- 💾 **Calendar Preference Memory** - Remembers your last calendar choice
- 🔁 **Smart Error Recovery** - Retry button preserves image and reprocesses
- 📳 **Haptic Feedback** - Vibration patterns for success, error, warning actions
- 🎯 **Field Confidence Breakdown** - Visual badges on uncertain fields
- 📸 **Enhanced Camera Support** - Direct camera access on mobile devices
- ⚡ **Improved User Flow** - Smoother experience with preserved context

**Backend Enhancements**
- 📊 **Per-field Confidence** - AI now rates each field individually (title, date, time, location, description)
- 🎨 **Visual Indicators** - Yellow "Verify" and red "Check!" badges for low confidence fields
- 🔍 **Better Accuracy** - More granular feedback helps users focus on uncertain extractions

### Version 3.0 (October 31, 2025)

**Major Architecture Change: Calendar Integration**
- 🚀 **Removed OAuth requirement** - No verification needed!
- 📅 **Multi-calendar support** - Google, Apple, Outlook, Yahoo
- 🎨 **Beautiful modal UI** - Smooth animations and provider selection
- ✅ **Production ready** - Works for unlimited users immediately
- 🔗 **Industry standard** - Uses calendar links like Eventbrite, Meetup

**Auto-Update System**
- 🔄 **Smart caching** - Proper cache control headers
- ⚡ **Instant updates** - No manual cache clearing needed
- � **Update notifications** - Users notified of new versions
- 🌐 **Network-first** - Always tries to fetch fresh content
- � **Versioned caching** - Automatic old cache cleanup

**Previous Updates (Version 2.0)**
- 🤖 Upgraded to Gemini 2.0 Flash model
- � Enhanced extraction: recurring events, registration, organizer info
- 🌍 Multi-language support
- 🎨 Glassmorphism UI with dark mode
- 📋 Drag & drop and paste support
- ⚠️ Confidence scoring system

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🎯 Technical Highlights

### AI Processing
- **Model**: Google Gemini 2.0 Flash (Experimental)
- **Vision API**: Multimodal content analysis
- **Context-Aware**: Understands event context, not just OCR
- **Multi-Language**: Automatic language detection
- **Structured Output**: Nested JSON with validation

### Calendar Integration
- **No OAuth**: Uses standard calendar URL protocols
- **Universal**: Works on all devices and browsers
- **ICS Generation**: Creates standard `.ics` files for Apple Calendar
- **URL Formatting**: Google, Outlook, Yahoo pre-fill URLs
- **Privacy**: No permission grants needed

### Performance
- **Bundle Size**: 98% smaller than Tesseract approach
- **Processing Time**: 2-5 seconds average
- **Compression**: Automatic image optimization
- **Caching**: Smart cache headers for fast loads
- **PWA**: Installable, works offline

### Developer Experience
- **Simple Setup**: One API key, no OAuth configuration
- **Clean Code**: Well-documented, modular architecture
- **Auto-Deploy**: Firebase CI/CD ready
- **Error Handling**: Comprehensive error messages
- **Monitoring**: Easy to integrate with analytics

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) for the AI vision API
- [Firebase](https://firebase.google.com/) for hosting and functions
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

- 🌐 **Live App**: [event-snap.web.app](https://event-snap.web.app)
- 📧 **Email**: gdwu007@gmail.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/gordowuu/EventScan/issues)
- 📖 **Documentation**: `SECURITY.md` for security guidelines
- 🔒 **Privacy**: [Privacy Policy](https://event-snap.web.app/privacy.html)
- 📜 **Terms**: [Terms of Service](https://event-snap.web.app/terms.html)

## 🗺️ Roadmap

### Completed ✅
- ✅ Multi-calendar support (Google, Apple, Outlook)
- ✅ Futuristic dark theme with particle effects
- ✅ Recurring event detection with RRULE support
- ✅ Multi-language support
- ✅ PWA capabilities with offline support
- ✅ Auto-update system
- ✅ Drag & drop + paste support
- ✅ Calendar preference persistence
- ✅ Error recovery with retry
- ✅ Field-level confidence indicators with dark theme
- ✅ Mobile-optimized camera/file selection
- ✅ Responsive layouts for all screen sizes
- ✅ GitHub repository link in footer
- ✅ Themed success pages
- ✅ Smart scroll-to-top navigation

### Planned 📋
- [ ] Batch processing for multiple posters
- [ ] Event reminder customization
- [ ] Export to ICS with all metadata
- [ ] Image cropping/editing before processing
- [ ] Browser extension
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations
- [ ] Dark/light theme toggle (currently dark only)
- [ ] Custom color scheme options

---

**Made with ❤️ using AI and Firebase**
