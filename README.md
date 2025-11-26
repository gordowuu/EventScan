# 📸 EventSnap - Smart Event Poster to Calendar

Transform event posters into calendar events instantly using AI vision technology. No OAuth verification needed!

![EventSnap Demo](https://img.shields.io/badge/Status-Production%20Ready-success)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF)
![Tailwind](https://img.shields.io/badge/Tailwind-4.x-38B2AC)
![Firebase](https://img.shields.io/badge/Firebase-v10-orange)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### Core Functionality
- 🤖 **AI Vision Processing** - Google's Gemini 2.5 Flash for advanced image understanding
- 📅 **Multi-Calendar Support** - Export to Google, Apple, Outlook, Yahoo calendars
- 🚀 **No OAuth Required** - Industry-standard calendar links, no verification needed
- 📱 **Mobile Optimized** - PWA-ready with responsive design and mobile-first approach
- ⚡ **Fast & Efficient** - Automatic image compression and optimization
- 🔒 **Privacy First** - No data storage, client-side processing
- 📦 **Batch Processing** - Process multiple event posters at once

### Smart Features
- 💪 **Advanced Extraction** - Detects title, date, time, location, description
- 🔁 **Recurring Events** - Identifies and configures repeat patterns with RRULE support
- 🎟️ **Registration Info** - Extracts URLs, prices, deadlines
- 👤 **Organizer Details** - Captures contact info and websites
- 🌍 **Multi-Language** - Supports events in any language
- ⚠️ **Confidence Scoring** - Visual field-level indicators show extraction reliability
- 📱 **QR Code Detection** - Automatically scans QR codes in posters

### User Experience
- 🎨 **Futuristic Dark UI** - Beautiful glassmorphism design with purple/pink gradient theme
- ✨ **Smooth Animations** - Subtle, non-distracting animated effects
- 📋 **Drag & Drop** - Upload by dragging files
- 📎 **Paste Support** - Paste images directly from clipboard
- 📸 **Smart Camera Access** - Choose between camera, gallery, or files on mobile
- 🔄 **Auto-Update** - Automatic app updates without cache clearing
- 💾 **Smart Preferences** - Remembers your calendar choice
- 🔁 **Error Recovery** - Retry failed extractions with one click
- 🔍 **Image Lightbox** - Click to enlarge poster for detail review
- 🏠 **Easy Navigation** - Click logo to return home anytime

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Firebase CLI](https://firebase.google.com/docs/cli) installed globally
- Google Cloud account with Gemini API access
- Firebase project with Blaze (pay-as-you-go) plan

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gordowuu/EventSnap.git
   cd EventSnap
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
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

5. **Development**
   ```bash
   npm run dev
   ```

6. **Build & Deploy**
   ```bash
   npm run deploy
   ```

## 🔧 Tech Stack

### Frontend (Vite + Modern JS)
- **Vite 7** - Lightning-fast build tool
- **Tailwind CSS 4** - Utility-first CSS with @tailwindcss/vite plugin
- **ES Modules** - Modern JavaScript architecture
- **PWA** - Service worker for offline support

### Backend (Firebase)
- **Cloud Functions** - Node.js 20, Gen 2
- **Hosting** - Global CDN with cache headers
- **Secret Manager** - Secure API key storage

### AI
- **Google Gemini 2.5 Flash** - Multimodal vision processing

## 🏗️ Project Structure

```
eventsnap/
├── src/                    # Source files (Vite)
│   ├── main.js            # App entry point
│   ├── styles/            # CSS files
│   │   ├── main.css       # Core styles + Tailwind
│   │   └── animations.css # Animation keyframes
│   ├── modules/           # ES modules
│   │   ├── config.js      # Firebase & app config
│   │   ├── image-processor.js
│   │   ├── calendar-providers.js
│   │   ├── batch-processor.js
│   │   ├── qr-detector.js
│   │   ├── ui.js
│   │   ├── share.js
│   │   ├── export.js
│   │   └── particles-manager.js
│   └── lib/               # Third-party libs
│       └── particles.min.js
├── public/                # Static assets
│   ├── icons/            # PWA icons
│   ├── manifest.json     # PWA manifest
│   ├── sw.js             # Service worker
│   ├── privacy.html      # Privacy policy
│   ├── terms.html        # Terms of service
│   └── 404.html          # Error page
├── functions/            # Firebase Cloud Functions
│   ├── index.js          # AI processing with Gemini
│   └── package.json
├── index.html            # Main HTML (Vite entry)
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies
├── firebase.json         # Firebase config
└── README.md
```

## 📖 Usage

1. **Visit** [event-snap.web.app](https://event-snap.web.app)
2. **Upload an event poster**
   - Click to browse, drag & drop, or paste from clipboard
   - Select multiple images for batch processing
   - Supports JPG/PNG, up to 4MB
3. **Review extracted details**
   - AI extracts title, date, time, location, and more
   - Click image to enlarge for reference
   - Confidence indicators show extraction quality
4. **Edit if needed** - Adjust any details
5. **Add to Calendar**
   - Choose from 4 calendar providers
   - Event opens pre-filled in your calendar

## 🔒 Security & Privacy

- ✅ **No Data Storage** - Images and event data are NOT stored
- ✅ **No User Accounts** - No sign-up or login required
- ✅ **No Tracking** - Minimal analytics, no personal data collection
- ✅ **Client-Side Processing** - Image compression in browser
- ✅ **HTTPS Only** - All connections encrypted
- ✅ **API Keys Secured** - Stored in Firebase Secret Manager

See [SECURITY.md](SECURITY.md) for detailed guidelines.

## 📊 Recent Updates

### Version 5.1 (November 2025) 🎨 **Vite Migration & Polish**

**Architecture Upgrade**
- ⚡ **Vite Build System** - Lightning-fast dev & builds
- 🎨 **Tailwind CSS 4** - Latest with @tailwindcss/vite plugin
- 📦 **ES Modules** - Clean, modular JavaScript architecture
- 🔄 **Hot Module Replacement** - Instant dev updates

**UI/UX Improvements**
- 🎭 **Smoother Animations** - Slowed down, less distracting
- 🔍 **Image Lightbox** - Click poster to enlarge
- 🏠 **Clickable Logo** - Return to home from any screen
- ✨ **Enhanced Batch Processing** - Edit button hover effects
- 📦 **Better Batch UI** - Same spinner style as single processing

**Bug Fixes**
- 🔧 **Animation Override** - Works despite reduced-motion preference
- 🔧 **Button Hover States** - All buttons fill properly
- 🔧 **Edit Modal** - Fully functional save & add to calendar

### Version 5.0 (November 2025) 📦 **Batch Processing**

- 📦 **Batch Upload** - Process multiple posters at once
- ✏️ **Batch Edit** - Review and edit each extracted event
- 📅 **Add All** - One-click add all events to calendar
- 🎨 **Progress UI** - Visual feedback during batch processing

### Previous Versions
- **v4.0** - Futuristic dark theme, particle effects
- **v3.1** - Calendar memory, error recovery, haptics
- **v3.0** - Multi-calendar support, removed OAuth
- **v2.0** - Gemini 2.0 Flash, enhanced extraction

## 💰 Cost Estimates

Based on Gemini 2.5 Flash pricing:
- **100 images/month**: ~$0.02 (essentially free)
- **1,000 images/month**: ~$0.20
- **10,000 images/month**: ~$2.00

Firebase free tier covers hosting and ~2M function invocations/month.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

- 🌐 **Live App**: [event-snap.web.app](https://event-snap.web.app)
- 📧 **Email**: gdwu007@gmail.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/gordowuu/EventSnap/issues)
- 🔒 **Privacy**: [Privacy Policy](https://event-snap.web.app/privacy.html)
- 📜 **Terms**: [Terms of Service](https://event-snap.web.app/terms.html)

---

**Made with ❤️ using Vite, Tailwind, and Firebase**
