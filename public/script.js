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

// --- Google API Configuration ---
// TODO: Move to secure environment configuration
const GOOGLE_CLIENT_ID = '804076361371-qbegh1hmbjrtd4ub6m23kpfmb9qhcchv.apps.googleusercontent.com';
const GOOGLE_API_KEY = firebaseConfig.apiKey;
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

// Image processing configuration
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB max
const COMPRESSION_QUALITY = 0.85;
const MAX_DIMENSION = 2048;

let tokenClient;
let gapiInited = false;
let gisInited = false;

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

// --- Load and Initialize Google API Client ---
window.onload = () => {
    // Initialize Google APIs when scripts are loaded
    if (window.gapi) {
        gapi.load('client', initializeGapiClient);
    }
    
    if (window.google?.accounts) {
        initializeGisClient();
    }
    
    // Add file size validation to input
    imageInput.addEventListener('change', validateFileSize);
};

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
        });
        gapiInited = true;
        console.log('Google API Client initialized successfully');
    } catch (error) {
        console.error("Error initializing Google API Client:", error);
    }
}

function initializeGisClient() {
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            callback: '', // Callback is handled by the promise
        });
        gisInited = true;
        console.log('Google Identity Services initialized successfully');
    } catch (error) {
        console.error("Error initializing Google Sign-In:", error);
    }
}

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

createGcalBtn.addEventListener('click', addToGoogleCalendar);

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
 * Handles the entire Google Calendar creation flow.
 */
async function addToGoogleCalendar() {
    if (!gapiInited || !gisInited) {
        alert("Google API is not ready yet. Please check your browser console for errors and verify your Client ID configuration.");
        return;
    }

    // 1. Get user's permission via OAuth
    try {
        await new Promise((resolve, reject) => {
            tokenClient.callback = (resp) => {
                if (resp.error !== undefined) {
                    reject(resp);
                }
                resolve(resp);
            };
            tokenClient.requestAccessToken({ prompt: 'consent' });
        });
    } catch (err) {
        console.error("Error getting user consent:", err);
        alert("Could not get permission to access your calendar. Please try again.");
        return;
    }


    // 2. Prepare event data for the API
    const eventDetails = getEventDetailsFromForm();
    if (!eventDetails.startTime || !eventDetails.endTime) {
        alert("Please ensure both a start and end time are set before creating a calendar event.");
        return;
    }

    const event = {
        'summary': eventDetails.title,
        'location': eventDetails.location,
        'description': eventDetails.description,
        'start': {
            'dateTime': new Date(eventDetails.startTime).toISOString(),
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        'end': {
            'dateTime': new Date(eventDetails.endTime).toISOString(),
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
    };

    // 3. Make the API request to create the event
    createGcalBtn.disabled = true;
    createGcalBtn.textContent = 'Creating...';
    
    try {
        const request = gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event,
        });

        const response = await request;
        console.log('Event created: ', response.result);
        showSuccess(`Event "${response.result.summary}" was successfully added to your Google Calendar!`);
        
        // Reset form after success
        setTimeout(() => {
            verificationScreen.classList.add('hidden');
            uploadForm.classList.remove('hidden');
            retakeBtn.click();
        }, 2000);
    } catch (err) {
        console.error('Error creating event:', err);
        let message = 'Failed to create calendar event. Please try again.';
        
        if (err.result?.error?.message) {
            message = err.result.error.message;
        }
        
        showError(message);
    } finally {
        createGcalBtn.disabled = false;
        createGcalBtn.textContent = 'Add to Google Calendar';
    }
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

