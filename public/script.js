// --- Firebase Initialization ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// --- Configuration ---
// NOTE: These values should ideally come from environment variables in production
// Firebase config is safe to expose for client apps (with proper security rules)
const firebaseConfig = {
  apiKey: "AIzaSyC9_9d9rKxiKgk9VvybWWXSniL4pYC0AmM",
  authDomain: "eventsnap-backend.firebaseapp.com",
  projectId: "eventsnap-backend",
  storageBucket: "eventsnap-backend.firebasestorage.app",
  messagingSenderId: "804076361371",
  appId: "1:804076361371:web:6ff59e4129f408369b583e",
  measurementId: "G-C6B8MPB0H6"
};

// Image processing configuration
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB max
const COMPRESSION_QUALITY = 0.85;
const MAX_DIMENSION = 2048;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "us-central1");
const parseEventImage = httpsCallable(functions, 'parseEventImage');
const parseEventText = httpsCallable(functions, 'parseEventText'); // Deprecated fallback

// --- DOM Element References ---
const uploadForm = document.getElementById('upload-form');
const imageInput = document.getElementById('image-input');
const retakeBtn = document.getElementById('retake-btn');
const processBtn = document.getElementById('process-btn');
const imagePreview = document.getElementById('image-preview');
const filePrompt = document.getElementById('file-prompt');
const previewContainer = document.getElementById('preview-container');

const processingScreen = document.getElementById('processing-screen');
const processingMessage = document.getElementById('processing-message');

const verificationScreen = document.getElementById('verification-screen');
const posterImage = document.getElementById('poster-image');
const eventForm = document.getElementById('event-form');
const titleInput = document.getElementById('title');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const locationInput = document.getElementById('location');
const descriptionInput = document.getElementById('description');
const backBtn = document.getElementById('back-btn');
const createGcalBtn = document.getElementById('create-gcal-btn');

let currentImageBlob = null;
let currentEventData = null; // Store event data with confidence info

// --- Dark Mode Support ---
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

// Check for saved theme preference or default to system preference
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark-mode');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
}

// Theme toggle handler
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    sunIcon.classList.toggle('hidden', isDark);
    moonIcon.classList.toggle('hidden', !isDark);
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        if (e.matches) {
            document.body.classList.add('dark-mode');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            document.body.classList.remove('dark-mode');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    }
});

// --- App Initialization ---
window.onload = () => {
    // Add file size validation to input
    imageInput.addEventListener('change', validateFileSize);
};

// --- Event Listeners ---

imageInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

// Enhanced drag and drop
filePrompt.addEventListener('dragover', (e) => {
    e.preventDefault();
    filePrompt.classList.add('border-indigo-500', 'bg-indigo-50');
    filePrompt.style.transform = 'scale(1.02)';
});

filePrompt.addEventListener('dragleave', (e) => {
    filePrompt.classList.remove('border-indigo-500', 'bg-indigo-50');
    filePrompt.style.transform = 'scale(1)';
});

filePrompt.addEventListener('drop', (e) => {
    e.preventDefault();
    filePrompt.classList.remove('border-indigo-500', 'bg-indigo-50');
    filePrompt.style.transform = 'scale(1)';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

// Paste from clipboard support
document.addEventListener('paste', (e) => {
    // Only handle paste when on upload screen
    if (!uploadForm.classList.contains('hidden')) {
        const items = e.clipboardData?.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    handleFileSelect(blob);
                    showSuccess('Image pasted from clipboard!');
                    break;
                }
            }
        }
    }
});

retakeBtn.addEventListener('click', () => {
    imageInput.value = '';
    currentImageBlob = null;
    imagePreview.src = '#';
    previewContainer.classList.add('hidden');
    filePrompt.classList.remove('hidden');
});

processBtn.addEventListener('click', async () => {
    if (!currentImageBlob) {
        showError("Please select an image first.");
        return;
    }
    
    uploadForm.classList.add('hidden');
    processingScreen.classList.remove('hidden');

    try {
        processingMessage.textContent = '📸 Compressing image...';
        const compressedImage = await compressImage(currentImageBlob);
        
        processingMessage.textContent = '🤖 Analyzing poster with AI...';
        const imageData = await blobToBase64(compressedImage);
        const mimeType = compressedImage.type;
        
        const result = await parseEventImage({ 
            imageData: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
            mimeType 
        });
        
        currentEventData = result.data.eventData;
        
        // Show warnings if any
        if (result.data.warning) {
            showWarning(result.data.warning);
        }
        
        if (currentEventData.warnings && currentEventData.warnings.length > 0) {
            showWarning(currentEventData.warnings.join('. '));
        }

        populateVerificationForm(currentEventData);
        processingScreen.classList.add('hidden');
        verificationScreen.classList.remove('hidden');
        
        // Expand container for verification screen on desktop
        document.getElementById('main-container').classList.add('verification-mode');
        
        // Show confidence indicator
        showConfidenceIndicator(currentEventData.confidence);
        
    } catch (error) {
        console.error("Error processing image:", error);
        console.log("Error details:", {
            message: error.message,
            code: error.code,
            details: error.details
        });
        handleProcessingError(error);
        processingScreen.classList.add('hidden');
        uploadForm.classList.remove('hidden');
    }
});

backBtn.addEventListener('click', () => {
    verificationScreen.classList.add('hidden');
    uploadForm.classList.remove('hidden');
    
    // Restore small container for upload screen
    document.getElementById('main-container').classList.remove('verification-mode');
    
    retakeBtn.click();
});

createGcalBtn.addEventListener('click', showCalendarOptions);

// --- Core Functions ---

function validateFileSize(e) {
    const file = e.target.files[0];
    if (file && file.size > MAX_IMAGE_SIZE) {
        showError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please use an image under 4MB.`);
        imageInput.value = '';
        return false;
    }
    return true;
}

function handleFileSelect(file) {
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image/(jpeg|jpg|png)')) {
        showError('Please upload a JPG or PNG image.');
        return;
    }
    
    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
        showError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please use an image under 4MB.`);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        imagePreview.src = event.target.result;
        posterImage.src = event.target.result;
        filePrompt.classList.add('hidden');
        previewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
    currentImageBlob = file;
}

/**
 * Compress image to reduce file size and dimensions
 */
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Resize if too large
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    if (width > height) {
                        height = (height / width) * MAX_DIMENSION;
                        width = MAX_DIMENSION;
                    } else {
                        width = (width / height) * MAX_DIMENSION;
                        height = MAX_DIMENSION;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            }));
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/jpeg',
                    COMPRESSION_QUALITY
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}

/**
 * Convert blob to base64 string
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function populateVerificationForm(eventData) {
    titleInput.value = eventData.title || '';
    startTimeInput.value = eventData.start_time || '';
    endTimeInput.value = eventData.end_time || '';
    locationInput.value = eventData.location || '';
    
    // Build enhanced description with extracted metadata
    let description = eventData.description || '';
    
    // Add recurring event info
    if (eventData.recurring?.is_recurring) {
        description += `\n\n🔄 Recurring Event: ${eventData.recurring.pattern}`;
    }
    
    // Add registration info
    if (eventData.registration?.url) {
        description += `\n\n🎟️ Registration: ${eventData.registration.url}`;
    }
    if (eventData.registration?.price) {
        description += `\n💰 Price: ${eventData.registration.price}`;
    }
    if (eventData.registration?.deadline) {
        description += `\n⏰ Register by: ${eventData.registration.deadline}`;
    }
    
    // Add organizer info
    if (eventData.organizer?.name) {
        description += `\n\n👤 Organizer: ${eventData.organizer.name}`;
    }
    if (eventData.organizer?.contact) {
        description += `\n📧 Contact: ${eventData.organizer.contact}`;
    }
    if (eventData.organizer?.website) {
        description += `\n🌐 Website: ${eventData.organizer.website}`;
    }
    
    descriptionInput.value = description.trim();
}

function getEventDetailsFromForm() {
    return {
        title: titleInput.value,
        startTime: startTimeInput.value,
        endTime: endTimeInput.value,
        location: locationInput.value,
        description: descriptionInput.value,
    };
}

/**
 * Show calendar provider selection modal
 */
function showCalendarOptions() {
    const eventDetails = getEventDetailsFromForm();
    if (!eventDetails.startTime || !eventDetails.endTime) {
        showError("Please ensure both a start and end time are set before creating a calendar event.");
        return;
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };

    // Calendar providers
    const providers = [
        {
            name: 'Google Calendar',
            icon: `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="#4285F4"/></svg>`,
            color: 'from-blue-500 to-blue-600',
            action: () => openGoogleCalendar(eventDetails)
        },
        {
            name: 'Apple Calendar',
            icon: `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#555555"/></svg>`,
            color: 'from-gray-600 to-gray-700',
            action: () => openAppleCalendar(eventDetails)
        },
        {
            name: 'Outlook',
            icon: `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M7 22h10c.552 0 1-.448 1-1V3c0-.552-.448-1-1-1H7c-.552 0-1 .448-1 1v18c0 .552.448 1 1 1zm5-15c2.206 0 4 1.794 4 4s-1.794 4-4 4-4-1.794-4-4 1.794-4 4-4z" fill="#0078D4"/></svg>`,
            color: 'from-blue-600 to-blue-700',
            action: () => openOutlookCalendar(eventDetails)
        },
        {
            name: 'Yahoo Calendar',
            icon: `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139C1.219 5.15 1.13 5.05 1 5H0v-.5h4.78v.5h-.81c-.264 0-.402.074-.402.222 0 .07.023.148.07.227.557 1.083 1.5 3.026 2.803 5.765.822-1.674 1.631-3.342 2.402-4.961.18-.379.322-.696.322-.895 0-.148-.138-.222-.415-.222H8v-.5h3.669v.5h-.221c-.415 0-.614.148-.614.444 0 .222.085.521.256.896.766 1.674 1.575 3.342 2.403 4.961 1.305-2.738 2.248-4.682 2.805-5.765.047-.079.07-.157.07-.227 0-.148-.138-.222-.401-.222H15v-.5h2.78v.5c-.13.05-.219.15-.435.328-.178.152-.368.538-.618 1.139-1.359 3.265-4.246 9.088-5.652 12.409-.405.902-.916 1.045-1.532-.029-.636-1.18-1.917-3.796-2.853-5.728z" fill="#6001D2"/></svg>`,
            color: 'from-purple-600 to-purple-700',
            action: () => openYahooCalendar(eventDetails)
        }
    ];

    modal.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <div class="text-center mb-6">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Add to Calendar</h3>
                <p class="text-sm text-gray-600">Choose your preferred calendar app</p>
            </div>
            
            <div class="space-y-3">
                ${providers.map((provider, index) => `
                    <button 
                        class="calendar-provider-btn w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-transparent hover:shadow-lg transition-all duration-200 group bg-gradient-to-r hover:${provider.color} hover:text-white"
                        data-provider="${index}"
                    >
                        <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                            ${provider.icon}
                        </div>
                        <div class="flex-1 text-left">
                            <p class="font-semibold text-gray-900 group-hover:text-white transition-colors">${provider.name}</p>
                        </div>
                        <svg class="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                `).join('')}
            </div>
            
            <button class="mt-6 w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors" onclick="this.closest('.fixed').remove()">
                Cancel
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Add click handlers
    modal.querySelectorAll('.calendar-provider-btn').forEach((btn, index) => {
        btn.onclick = () => {
            providers[index].action();
            modal.remove();
        };
    });
}

/**
 * Format date for calendar URLs (YYYYMMDDTHHMMSSZ)
 */
function formatCalendarDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
}

/**
 * Open Google Calendar with pre-filled event
 */
function openGoogleCalendar(eventDetails) {
    const baseURL = "https://www.google.com/calendar/render?action=TEMPLATE";
    
    const params = new URLSearchParams({
        text: eventDetails.title || 'New Event',
        dates: `${formatCalendarDate(eventDetails.startTime)}/${formatCalendarDate(eventDetails.endTime)}`,
        details: eventDetails.description || '',
        location: eventDetails.location || ''
    });

    const url = `${baseURL}&${params.toString()}`;
    window.open(url, '_blank', 'width=800,height=600');
    showSuccess('Opening Google Calendar...');
}

/**
 * Open Apple Calendar (iCal format)
 */
function openAppleCalendar(eventDetails) {
    const icsContent = generateICS(eventDetails);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventDetails.title || 'event'}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSuccess('Calendar file downloaded. Open it to add to Apple Calendar.');
}

/**
 * Open Outlook Calendar
 */
function openOutlookCalendar(eventDetails) {
    const baseURL = "https://outlook.live.com/calendar/0/deeplink/compose";
    
    const params = new URLSearchParams({
        subject: eventDetails.title || 'New Event',
        startdt: new Date(eventDetails.startTime).toISOString(),
        enddt: new Date(eventDetails.endTime).toISOString(),
        body: eventDetails.description || '',
        location: eventDetails.location || '',
        path: '/calendar/action/compose',
        rru: 'addevent'
    });

    const url = `${baseURL}?${params.toString()}`;
    window.open(url, '_blank', 'width=800,height=600');
    showSuccess('Opening Outlook Calendar...');
}

/**
 * Open Yahoo Calendar
 */
function openYahooCalendar(eventDetails) {
    const baseURL = "https://calendar.yahoo.com/";
    
    const startTime = new Date(eventDetails.startTime);
    const endTime = new Date(eventDetails.endTime);
    const duration = Math.floor((endTime - startTime) / 1000 / 60 / 60); // hours
    
    const params = new URLSearchParams({
        v: '60',
        title: eventDetails.title || 'New Event',
        st: formatCalendarDate(eventDetails.startTime),
        dur: duration.toString().padStart(2, '0') + '00',
        desc: eventDetails.description || '',
        in_loc: eventDetails.location || ''
    });

    const url = `${baseURL}?${params.toString()}`;
    window.open(url, '_blank', 'width=800,height=600');
    showSuccess('Opening Yahoo Calendar...');
}

/**
 * Generate ICS file content for Apple Calendar and others
 */
function generateICS(eventDetails) {
    const startDate = formatCalendarDate(eventDetails.startTime);
    const endDate = formatCalendarDate(eventDetails.endTime);
    const timestamp = formatCalendarDate(new Date().toISOString());
    
    // Escape special characters in ICS format
    const escapeICS = (str) => {
        if (!str) return '';
        return str.replace(/\\/g, '\\\\')
                  .replace(/;/g, '\\;')
                  .replace(/,/g, '\\,')
                  .replace(/\n/g, '\\n');
    };

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EventSnap//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${timestamp}@eventsnap.web.app
DTSTAMP:${timestamp}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${escapeICS(eventDetails.title)}
DESCRIPTION:${escapeICS(eventDetails.description)}
LOCATION:${escapeICS(eventDetails.location)}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

/**
 * Legacy function - replaced by calendar options modal
 * Keeping for backward compatibility during transition
 */
async function addToGoogleCalendar() {
    showCalendarOptions();
}

/**
 * Show error message to user
 */
function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 max-w-md animate-slide-in border border-red-400';
    errorDiv.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div class="flex-1">
                <p class="font-bold text-lg">Error</p>
                <p class="text-sm mt-1 text-white/90">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-white/70 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 6000);
}

/**
 * Show warning message to user
 */
function showWarning(message) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'fixed top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-4 rounded-2xl shadow-2xl z-50 max-w-md animate-slide-in border border-yellow-300';
    warningDiv.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center mr-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <div class="flex-1">
                <p class="font-bold text-lg">Please Verify</p>
                <p class="text-sm mt-1">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 hover:text-gray-700 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    `;
    document.body.appendChild(warningDiv);
    setTimeout(() => warningDiv.remove(), 7000);
}

/**
 * Show success message to user
 */
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 max-w-md animate-slide-in border border-green-400';
    successDiv.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div class="flex-1">
                <p class="font-bold text-lg">Success!</p>
                <p class="text-sm mt-1 text-white/90">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-white/70 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    `;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 4000);
}

/**
 * Handle processing errors with specific messages
 */
function handleProcessingError(error) {
    console.log("handleProcessingError called with:", error);
    
    let message = "Something went wrong processing your image. Please try again.";
    
    // Check for specific error codes or messages
    if (error.code === 'functions/invalid-argument' || error.message?.includes('NOT_EVENT_IMAGE')) {
        message = "This doesn't appear to be an event poster. Please upload an image of an event flyer, poster, or announcement.";
    } else if (error.code === 'functions/failed-precondition' || error.message?.includes('INCOMPLETE_EVENT_DATA')) {
        message = "Could not find event date/time in the image. Please ensure the image is an event poster with visible date and time.";
    } else if (error.message?.includes('INVALID_IMAGE')) {
        message = "This image format is not supported. Please use JPG or PNG.";
    } else if (error.message?.includes('IMAGE_TOO_LARGE')) {
        message = "The image is too large. Please use an image under 4MB.";
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        message = "The service is busy right now. Please try again in a moment.";
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        message = "Network error. Please check your internet connection.";
    } else if (error.message?.includes('not found')) {
        message = "We couldn't find clear event details in this image. Try a clearer photo.";
    } else if (error.message?.includes("doesn't appear to be an event poster")) {
        // Direct match for the specific error message
        message = error.message;
    } else if (error.message && error.message !== 'Internal error') {
        // Use the actual error message from the backend if it's meaningful
        message = error.message;
    }
    
    console.log("Showing error message:", message);
    showError(message);
}

/**
 * Show confidence indicator
 */
function showConfidenceIndicator(confidence) {
    const indicator = document.getElementById('confidence-indicator');
    if (!indicator) {
        // Create indicator if it doesn't exist
        const indicatorDiv = document.createElement('div');
        indicatorDiv.id = 'confidence-indicator';
        indicatorDiv.className = 'mb-6 p-4 rounded-2xl border-2';
        
        if (confidence === 'high') {
            indicatorDiv.className += ' bg-gradient-to-r from-green-50 to-emerald-50 border-green-300';
            indicatorDiv.innerHTML = '<div class="flex items-center gap-3"><div class="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></div><div><p class="text-sm font-bold text-green-900">High Confidence</p><p class="text-xs text-green-700">All details were clearly extracted</p></div></div>';
        } else if (confidence === 'medium') {
            indicatorDiv.className += ' bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300';
            indicatorDiv.innerHTML = '<div class="flex items-center gap-3"><div class="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></div><div><p class="text-sm font-bold text-yellow-900">Medium Confidence</p><p class="text-xs text-yellow-700">Please double-check the details below</p></div></div>';
        } else {
            indicatorDiv.className += ' bg-gradient-to-r from-red-50 to-pink-50 border-red-300';
            indicatorDiv.innerHTML = '<div class="flex items-center gap-3"><div class="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg></div><div><p class="text-sm font-bold text-red-900">Low Confidence</p><p class="text-xs text-red-700">We had trouble reading this poster. Please verify carefully</p></div></div>';
        }
        
        eventForm.insertBefore(indicatorDiv, eventForm.firstChild);
    }
}

// --- PWA Service Worker ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered.'))
            .catch(err => console.error('SW registration failed:', err));
    });
}

