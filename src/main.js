/**
 * EventSnap Main Entry Point
 * Version 5.0 - Vite + Modular Architecture
 */

// Import styles
import './styles/main.css';
import './styles/animations.css';

// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// Import modules
import { firebaseConfig } from './modules/config.js';
import { validateImage, compressImage, blobToBase64, createPreview } from './modules/image-processor.js';
import {
  openGoogleCalendar,
  openAppleCalendar,
  openOutlookCalendar,
  openYahooCalendar
} from './modules/calendar-providers.js';
import {
  showToast,
  showSuccess,
  showError,
  showWarning,
  triggerHapticFeedback,
  showScreen,
  updateProcessingStatus,
  markProcessingComplete,
  addConfidenceIndicator,
  showConfidenceIndicator,
  showUpdateNotification,
  showInstallPrompt,
  showCalendarModal,
  populateVerificationForm
} from './modules/ui.js';
import { shareEvent, copyEventDetails } from './modules/share.js';
import { downloadICS, downloadJSON, copyFormattedText, createExportDropdown } from './modules/export.js';
import { BatchProcessor, renderBatchResults, createBatchProgressUI } from './modules/batch-processor.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "us-central1");
const parseEventImage = httpsCallable(functions, 'parseEventImage');

// Global state
let currentImageBlob = null;
let currentEventData = null;
let batchProcessor = null;
let deferredInstallPrompt = null;

// DOM element references
let elements = {};

/**
 * Enable animations override (for users with reduced-motion preference)
 * This allows the site to show animations even when the OS preference is set
 */
function enableAnimations() {
  // Add class to body to override reduced-motion CSS
  document.body.classList.add('animations-enabled');
  console.log('[Animations] Enabled: Overriding reduced-motion preference for this site');
}

/**
 * Initialize the application
 */
function initApp() {
  // Enable animations immediately (override reduced-motion for this app)
  enableAnimations();

  // Get DOM elements
  elements = {
    uploadScreen: document.getElementById('upload-screen-exp'),
    imageInput: document.getElementById('image-input-exp'),
    retakeBtn: document.getElementById('retake-btn-exp'),
    processBtn: document.getElementById('process-btn-exp'),
    imagePreview: document.getElementById('image-preview-exp'),
    dropZone: document.getElementById('drop-zone-exp'),
    previewContainer: document.getElementById('preview-container-exp'),

    processingScreen: document.getElementById('processing-screen-exp'),
    processingMessage: document.getElementById('processing-message-exp'),

    verificationScreen: document.getElementById('verification-screen-exp'),
    posterImage: document.getElementById('poster-image-exp'),
    eventForm: document.getElementById('event-form-exp'),
    titleInput: document.getElementById('title-exp'),
    startTimeInput: document.getElementById('start-time-exp'),
    endTimeInput: document.getElementById('end-time-exp'),
    locationInput: document.getElementById('location-exp'),
    descriptionInput: document.getElementById('description-exp'),
    backBtn: document.getElementById('back-btn-exp'),
    createGcalBtn: document.getElementById('create-gcal-btn-exp'),

    recurringSection: document.getElementById('recurring-section-exp'),
    isRecurringCheckbox: document.getElementById('is-recurring-exp'),
    recurringOptions: document.getElementById('recurring-options-exp'),
    recurringFrequency: document.getElementById('recurring-frequency-exp'),
    recurringPattern: document.getElementById('recurring-pattern-exp'),

    batchResultsScreen: document.getElementById('batch-results-screen'),
    batchResultsContainer: document.getElementById('batch-results-container')
  };

  // Initialize batch processor
  batchProcessor = new BatchProcessor(parseEventImage);

  // Set up event listeners
  setupEventListeners();

  // Initialize particles (lazy loaded)
  initParticlesLazy();

  // Set up service worker
  setupServiceWorker();

  // Set up install prompt
  setupInstallPrompt();

  console.log('[EventSnap] App initialized (v5.0)');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // File input - now supports multiple files
  elements.imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 1) {
      handleSingleFile(files[0]);
    } else if (files.length > 1) {
      handleMultipleFiles(files);
    }
  });

  // Drop zone click
  elements.dropZone.addEventListener('click', () => elements.imageInput.click());

  // Drag and drop
  elements.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropZone.classList.add('drag-over');
  });

  elements.dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('drag-over');
  });

  elements.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 1) {
      handleSingleFile(files[0]);
      showSuccess('Image loaded!');
    } else if (files.length > 1) {
      handleMultipleFiles(files);
      showSuccess(`${files.length} images loaded!`);
    }
  });

  // Paste from clipboard
  document.addEventListener('paste', (e) => {
    if (!elements.uploadScreen.classList.contains('hidden')) {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            handleSingleFile(blob);
            showSuccess('Image pasted from clipboard!');
            break;
          }
        }
      }
    }
  });

  // Retake button
  elements.retakeBtn.addEventListener('click', resetUpload);

  // Process button
  elements.processBtn.addEventListener('click', processCurrentImage);

  // Back button
  elements.backBtn.addEventListener('click', () => {
    showScreen('upload-screen-exp');
    resetUpload();
  });

  // Create calendar button
  elements.createGcalBtn.addEventListener('click', showCalendarOptions);

  // Recurring event checkbox
  elements.isRecurringCheckbox.addEventListener('change', () => {
    elements.recurringOptions.classList.toggle('hidden', !elements.isRecurringCheckbox.checked);
  });

  // Header logo click - return to main page
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', () => {
      showScreen('upload-screen-exp');
      resetUpload();
    });
  }

  // Poster image click - open lightbox
  elements.posterImage.addEventListener('click', () => {
    openImageLightbox(elements.posterImage.src);
  });

  // Form validation
  setupFormValidation();
}

/**
 * Open image lightbox for enlarged view
 * @param {string} imageSrc - Image source URL
 */
function openImageLightbox(imageSrc) {
  // Create lightbox element
  const lightbox = document.createElement('div');
  lightbox.className = 'image-lightbox';
  lightbox.innerHTML = `
    <button class="close-lightbox" title="Close">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
    <img src="${imageSrc}" alt="Enlarged poster">
  `;

  // Close on click anywhere
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.closest('.close-lightbox')) {
      lightbox.remove();
    }
  });

  // Close on escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      lightbox.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  document.body.appendChild(lightbox);
}

/**
 * Handle single file selection
 */
async function handleSingleFile(file) {
  const validation = validateImage(file);
  if (!validation.valid) {
    showError(validation.error);
    return;
  }

  const preview = await createPreview(file);
  elements.imagePreview.src = preview;
  elements.posterImage.src = preview;
  elements.dropZone.classList.add('hidden');
  elements.previewContainer.classList.remove('hidden');
  currentImageBlob = file;
}

/**
 * Handle multiple file selection (batch processing)
 */
async function handleMultipleFiles(files) {
  batchProcessor.clear();
  const count = await batchProcessor.addFiles(files);

  if (count === 0) {
    showError('No valid images found');
    return;
  }

  showSuccess(`${count} images queued for processing`);

  // Show processing screen with batch UI
  showScreen('processing-screen-exp');
  const progressUI = createBatchProgressUI(elements.processingScreen);

  // Set up progress callback
  batchProcessor.onProgress = (current, total, item) => {
    progressUI.updateProgress(current, total, item);
    progressUI.addThumbnail(item.preview, 'processing');
  };

  // Process all files
  const results = await batchProcessor.processAll();

  // Show results
  showScreen('batch-results-screen');
  renderBatchResults(results, elements.batchResultsContainer, (eventData) => {
    // Format for calendar
    const formatted = {
      title: eventData.title,
      startTime: eventData.start_time,
      endTime: eventData.end_time,
      location: eventData.location,
      description: eventData.description,
      recurring: eventData.recurring
    };
    showCalendarOptionsForEvent(formatted);
  });
}

/**
 * Process current single image
 */
async function processCurrentImage() {
  if (!currentImageBlob) {
    showError("Please select an image first.");
    return;
  }

  showScreen('processing-screen-exp');

  try {
    // Detect QR codes (lazy load module)
    updateProcessingStatus('Scanning for QR codes...');
    const { detectQRCodes } = await import('./modules/qr-detector.js');
    const qrUrls = await detectQRCodes(currentImageBlob);

    updateProcessingStatus('Enhancing & compressing image...');
    const compressedImage = await compressImage(currentImageBlob);

    updateProcessingStatus('Analyzing poster with AI...');
    const imageData = await blobToBase64(compressedImage);
    const mimeType = compressedImage.type;

    const result = await parseEventImage({
      imageData: imageData.split(',')[1],
      mimeType
    });

    currentEventData = result.data.eventData;

    // Add QR code URL if detected
    if (qrUrls.length > 0 && !currentEventData.registration?.url) {
      if (!currentEventData.registration) {
        currentEventData.registration = {};
      }
      currentEventData.registration.url = qrUrls[0];
      currentEventData.registration.source = 'qr_code';
      showSuccess('QR code detected and registration link extracted!');
    }

    // Show warnings
    if (result.data.warning) {
      showWarning(result.data.warning);
    }
    if (currentEventData.warnings?.length > 0) {
      showWarning(currentEventData.warnings.join('. '));
    }

    // Mark processing complete before transitioning
    markProcessingComplete();

    // Small delay to show the completed state
    await new Promise(resolve => setTimeout(resolve, 500));

    populateVerificationForm(elements, currentEventData);
    showScreen('verification-screen-exp');
    showConfidenceIndicator(currentEventData.confidence);

  } catch (error) {
    console.error("Error processing image:", error);
    handleProcessingError(error);
    showScreen('upload-screen-exp');
  }
}

/**
 * Get event details from the form
 */
function getEventDetailsFromForm() {
  const eventDetails = {
    title: elements.titleInput.value,
    startTime: elements.startTimeInput.value,
    endTime: elements.endTimeInput.value,
    location: elements.locationInput.value,
    description: elements.descriptionInput.value,
  };

  if (elements.isRecurringCheckbox.checked) {
    eventDetails.recurring = {
      is_recurring: true,
      frequency: elements.recurringFrequency.value,
      pattern: elements.recurringPattern.value
    };
  }

  return eventDetails;
}

/**
 * Show calendar provider selection modal
 */
function showCalendarOptions() {
  const eventDetails = getEventDetailsFromForm();
  showCalendarOptionsForEvent(eventDetails);
}

/**
 * Show calendar options for a specific event
 */
function showCalendarOptionsForEvent(eventDetails) {
  if (!eventDetails.startTime || !eventDetails.endTime) {
    showError("Please ensure both start and end times are set.");
    return;
  }

  const providers = [
    { id: 'google', name: 'Google Calendar', color: 'from-blue-500 to-blue-600', action: () => { openGoogleCalendar(eventDetails); showSuccess('Opening Google Calendar...'); }},
    { id: 'apple', name: 'Apple Calendar', color: 'from-gray-600 to-gray-700', action: () => { openAppleCalendar(eventDetails); showSuccess('Calendar file downloaded!'); }},
    { id: 'outlook', name: 'Outlook', color: 'from-blue-600 to-blue-700', action: () => { openOutlookCalendar(eventDetails); showSuccess('Opening Outlook...'); }},
    { id: 'yahoo', name: 'Yahoo Calendar', color: 'from-purple-600 to-purple-700', action: () => { openYahooCalendar(eventDetails); showSuccess('Opening Yahoo Calendar...'); }}
  ];

  showCalendarModal(eventDetails, providers, () => shareEvent(eventDetails));
}

/**
 * Handle processing errors
 */
function handleProcessingError(error) {
  triggerHapticFeedback('error');

  let message = "Something went wrong. Please try again.";

  if (error.message?.includes('NOT_EVENT_IMAGE')) {
    message = "This doesn't appear to be an event poster.";
  } else if (error.message?.includes('INCOMPLETE_EVENT_DATA')) {
    message = "Could not find event date/time in the image.";
  } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
    message = "Network error. Please check your connection.";
  } else if (error.message && error.message !== 'Internal error') {
    message = error.message;
  }

  showError(message);
}

/**
 * Reset upload form
 */
function resetUpload() {
  elements.imageInput.value = '';
  currentImageBlob = null;
  elements.imagePreview.src = '#';
  elements.previewContainer.classList.add('hidden');
  elements.dropZone.classList.remove('hidden');
}

/**
 * Set up form validation
 */
function setupFormValidation() {
  // Validate end time is after start time
  elements.endTimeInput.addEventListener('change', () => {
    const start = new Date(elements.startTimeInput.value);
    const end = new Date(elements.endTimeInput.value);

    if (end <= start) {
      elements.endTimeInput.classList.add('border-red-400');
      showWarning('End time should be after start time');
    } else {
      elements.endTimeInput.classList.remove('border-red-400');
    }
  });
}

/**
 * Initialize particles lazily
 */
async function initParticlesLazy() {
  // Use requestIdleCallback for non-critical initialization
  const initFn = async () => {
    try {
      const { initParticles } = await import('./modules/particles-manager.js');
      await initParticles();
    } catch (error) {
      console.warn('[Particles] Failed to initialize:', error);
    }
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(initFn);
  } else {
    setTimeout(initFn, 100);
  }
}

/**
 * Set up service worker
 */
function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('[SW] Registered');

          // Check for updates periodically
          setInterval(() => reg.update(), 30000);

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateNotification(newWorker);
              }
            });
          });
        })
        .catch(err => console.error('[SW] Registration failed:', err));
    });
  }
}

/**
 * Set up install prompt
 */
function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;

    // Show install prompt after a delay
    setTimeout(() => {
      if (deferredInstallPrompt) {
        showInstallPrompt(deferredInstallPrompt);
      }
    }, 30000); // Show after 30 seconds
  });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
