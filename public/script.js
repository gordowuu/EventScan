// --- Firebase and Tesseract Initialization ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// IMPORTANT: PASTE YOUR FIREBASE CONFIGURATION HERE
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
// IMPORTANT: PASTE YOUR OAUTH CLIENT ID FROM GOOGLE CLOUD CONSOLE HERE
const GOOGLE_CLIENT_ID = '804076361371-qbegh1hmbjrtd4ub6m23kpfmb9qhcchv.apps.googleusercontent.com';
const GOOGLE_API_KEY = firebaseConfig.apiKey; // Use the same API key
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

let tokenClient;
let gapiInited = false;
let gisInited = false;


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "us-central1");
const parseEventText = httpsCallable(functions, 'parseEventText');

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
const createIcsBtn = document.getElementById('create-ics-btn');
const createGcalBtn = document.getElementById('create-gcal-btn');

let currentImageBlob = null;

// --- Load and Initialize Google API Client ---
window.onload = () => {
    gapi.load('client', initializeGapiClient);
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGisClient;
    document.body.appendChild(script);
};

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    });
    gapiInited = true;
}

function initializeGisClient() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '', // Callback is handled by the promise
    });
    gisInited = true;
}

// --- Event Listeners ---

imageInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
filePrompt.addEventListener('dragover', (e) => {
    e.preventDefault();
    filePrompt.classList.add('border-blue-500', 'bg-blue-50');
});
filePrompt.addEventListener('dragleave', () => filePrompt.classList.remove('border-blue-500', 'bg-blue-50'));
filePrompt.addEventListener('drop', (e) => {
    e.preventDefault();
    filePrompt.classList.remove('border-blue-500', 'bg-blue-50');
    handleFileSelect(e.dataTransfer.files[0]);
});

retakeBtn.addEventListener('click', () => {
    imageInput.value = '';
    currentImageBlob = null;
    imagePreview.src = '#';
    previewContainer.classList.add('hidden');
    filePrompt.classList.remove('hidden');
});

processBtn.addEventListener('click', async () => {
    if (!currentImageBlob) return alert("Please select an image first.");
    uploadForm.classList.add('hidden');
    processingScreen.classList.remove('hidden');

    try {
        processingMessage.textContent = 'Scanning poster for text...';
        const ocrText = await performOCR(currentImageBlob);
        if (!ocrText || ocrText.trim().length < 10) throw new Error("Could not find enough text on the poster.");

        processingMessage.textContent = 'Understanding event details...';
        const result = await parseEventText({ text: ocrText });
        const eventData = result.data.eventData;

        populateVerificationForm(eventData);
        processingScreen.classList.add('hidden');
        verificationScreen.classList.remove('hidden');
    } catch (error) {
        console.error("Error processing image:", error);
        alert(`An error occurred: ${error.message}`);
        processingScreen.classList.add('hidden');
        uploadForm.classList.remove('hidden');
        retakeBtn.click();
    }
});

backBtn.addEventListener('click', () => {
    verificationScreen.classList.add('hidden');
    uploadForm.classList.remove('hidden');
    retakeBtn.click();
});

createIcsBtn.addEventListener('click', generateICS);
createGcalBtn.addEventListener('click', addToGoogleCalendar);

// --- Core Functions ---

function handleFileSelect(file) {
    if (!file) return;
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

async function performOCR(imageBlob) {
    const worker = await Tesseract.createWorker('eng', 1, { logger: m => console.log(m) });
    const { data: { text } } = await worker.recognize(imageBlob);
    await worker.terminate();
    return text;
}

function populateVerificationForm(eventData) {
    titleInput.value = eventData.title || '';
    startTimeInput.value = eventData.start_time || '';
    endTimeInput.value = eventData.end_time || '';
    locationInput.value = eventData.location || '';
    descriptionInput.value = eventData.description || '';
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
        alert("Google API is not ready yet. Please wait a moment and try again.");
        return;
    }

    // 1. Get user's permission via OAuth
    const tokenResponse = await new Promise((resolve, reject) => {
        try {
            tokenClient.callback = (resp) => {
                if (resp.error !== undefined) reject(resp);
                resolve(resp);
            };
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (err) {
            reject(err);
        }
    });

    // 2. Prepare event data for the API
    const eventDetails = getEventDetailsFromForm();
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
    try {
        const request = gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event,
        });

        const response = await request;
        console.log('Event created: ', response.result);
        alert(`Event "${response.result.summary}" was successfully added to your Google Calendar!`);
    } catch (err) {
        console.error('Error creating event:', err);
        alert(`Failed to create event. See console for details.`);
    }
}


/**
 * Generates and triggers a download for an .ics file.
 */
function generateICS() {
    const event = getEventDetailsFromForm();
    const formatTime = (dateTime) => dateTime ? new Date(dateTime).toISOString().replace(/-|:|\.\d+/g, '') : '';
    const icsContent = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EventSnap//EN', 'BEGIN:VEVENT',
        `UID:${Date.now()}@eventsnap.app`, `DTSTAMP:${formatTime(new Date().toISOString())}`,
        `DTSTART:${formatTime(event.startTime)}`, `DTEND:${formatTime(event.endTime)}`,
        `SUMMARY:${event.title}`, `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
        `LOCATION:${event.location}`, 'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- PWA Service Worker ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => console.log('SW registered.'), err => console.error('SW registration failed:', err));
    });
}



