/**
 * UI Module
 * Handles toast notifications, modals, haptic feedback, and UI state
 */

/**
 * Show modern toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type: 'success' | 'error' | 'warning' | 'info'
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container-exp');
  if (!container) return;

  const colors = {
    success: 'from-green-500 to-emerald-500 border-green-400',
    error: 'from-red-500 to-pink-500 border-red-400',
    warning: 'from-yellow-500 to-orange-500 border-yellow-400',
    info: 'from-blue-500 to-cyan-500 border-blue-400'
  };

  const icons = {
    success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
    error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
    warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>',
    info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
  };

  const toast = document.createElement('div');
  toast.className = `glass border-2 ${colors[type]} px-6 py-4 rounded-2xl shadow-2xl transform transition-all duration-500 ease-out translate-x-0 opacity-100`;
  toast.style.animation = 'fadeInUp 0.5s ease-out';

  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <svg class="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        ${icons[type]}
      </svg>
      <p class="text-white font-medium">${message}</p>
      <button onclick="this.closest('div').parentElement.remove()" class="ml-2 text-white/70 hover:text-white transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;

  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeInUp 0.5s ease-out reverse';
    setTimeout(() => toast.remove(), 500);
  }, 4000);

  // Haptic feedback
  triggerHapticFeedback(type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'light');
}

/**
 * Show success message
 * @param {string} message - Success message
 */
export function showSuccess(message) {
  showToast(message, 'success');
}

/**
 * Show error message
 * @param {string} message - Error message
 */
export function showError(message) {
  showToast(message, 'error');
}

/**
 * Show warning message
 * @param {string} message - Warning message
 */
export function showWarning(message) {
  showToast(message, 'warning');
}

/**
 * Trigger haptic feedback on mobile devices
 * @param {string} type - Feedback type: 'success' | 'error' | 'warning' | 'light'
 */
export function triggerHapticFeedback(type = 'light') {
  if ('vibrate' in navigator) {
    switch (type) {
      case 'success':
        navigator.vibrate([50, 30, 50]); // Double pulse
        break;
      case 'error':
        navigator.vibrate([100, 50, 100, 50, 100]); // Triple pulse
        break;
      case 'warning':
        navigator.vibrate([70]); // Single pulse
        break;
      case 'light':
      default:
        navigator.vibrate(20); // Quick tap
        break;
    }
  }
}

/**
 * Show screen by ID, hide all others
 * @param {string} screenId - The screen to show
 * @param {string[]} allScreenIds - All screen IDs to manage
 */
export function showScreen(screenId, allScreenIds = ['upload-screen-exp', 'processing-screen-exp', 'verification-screen-exp', 'batch-results-screen']) {
  allScreenIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      if (id === screenId) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    }
  });

  // Scroll to top when changing screens
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Update processing status message with emoji and progress
 * @param {string} message - Status message
 */
export function updateProcessingStatus(message) {
  const processingMessage = document.getElementById('processing-message-exp');
  const progressBar = document.getElementById('processing-progress-bar');
  const centerEmoji = document.getElementById('processing-emoji-center');

  // Determine step and emoji based on message content
  let emoji = '🔍';
  let step = 'scan';
  let progress = 10;

  if (message.toLowerCase().includes('qr')) {
    emoji = '📱';
    step = 'scan';
    progress = 20;
  } else if (message.toLowerCase().includes('compress') || message.toLowerCase().includes('enhancing')) {
    emoji = '📸';
    step = 'compress';
    progress = 40;
  } else if (message.toLowerCase().includes('ai') || message.toLowerCase().includes('analyzing')) {
    emoji = '🤖';
    step = 'ai';
    progress = 70;
  } else if (message.toLowerCase().includes('scan')) {
    emoji = '🔍';
    step = 'scan';
    progress = 15;
  } else if (message.toLowerCase().includes('retry')) {
    emoji = '🔄';
    progress = 50;
  }

  // Update message
  if (processingMessage) {
    processingMessage.innerHTML = `<span class="processing-emoji">${emoji}</span> ${message}`;
  }

  // Update center emoji
  if (centerEmoji) {
    centerEmoji.textContent = emoji;
  }

  // Update progress bar
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }

  // Update processing steps
  updateProcessingStep(step);
}

/**
 * Update the processing step indicators
 * @param {string} currentStep - Current step ID
 */
function updateProcessingStep(currentStep) {
  const steps = ['scan', 'compress', 'ai', 'done'];
  const stepElements = document.querySelectorAll('.processing-step');

  stepElements.forEach(el => {
    const stepName = el.dataset.step;
    const stepIndex = steps.indexOf(stepName);
    const currentIndex = steps.indexOf(currentStep);

    el.classList.remove('active', 'completed');

    if (stepIndex < currentIndex) {
      el.classList.add('completed');
    } else if (stepIndex === currentIndex) {
      el.classList.add('active');
    }
  });
}

/**
 * Mark processing as complete
 */
export function markProcessingComplete() {
  const progressBar = document.getElementById('processing-progress-bar');
  const centerEmoji = document.getElementById('processing-emoji-center');

  if (progressBar) {
    progressBar.style.width = '100%';
  }
  if (centerEmoji) {
    centerEmoji.textContent = '✅';
  }

  updateProcessingStep('done');
}

/**
 * Add visual confidence indicator to form fields
 * @param {HTMLElement} inputElement - The input element
 * @param {string} confidence - Confidence level: 'high' | 'medium' | 'low'
 * @param {string} fieldName - Name of the field for tooltip
 */
export function addConfidenceIndicator(inputElement, confidence, fieldName) {
  // Remove any existing indicator
  const existingIndicator = inputElement.parentElement.querySelector('.confidence-badge');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  // Remove existing confidence classes
  inputElement.classList.remove(
    'field-confidence-high', 'field-confidence-medium', 'field-confidence-low',
    'border-yellow-300', 'border-red-300', 'border-green-300',
    'bg-yellow-900/20', 'bg-red-900/20', 'bg-green-900/20'
  );

  // Apply confidence-based styling
  if (confidence === 'high') {
    inputElement.classList.add('field-confidence-high');
    return; // No badge needed for high confidence
  }

  // Create indicator badge for medium/low confidence
  const badge = document.createElement('div');
  badge.className = 'confidence-badge absolute -top-2 -right-2 z-10 animate-bounce';

  if (confidence === 'medium') {
    badge.innerHTML = `
      <div class="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-yellow-300 rounded-full text-xs font-bold text-white shadow-lg">
        <span>⚠️</span>
        <span>Verify</span>
      </div>
    `;
    inputElement.classList.add('field-confidence-medium');
    inputElement.title = `Medium confidence for ${fieldName}. Please double-check this field.`;
  } else if (confidence === 'low') {
    badge.innerHTML = `
      <div class="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 border-2 border-red-300 rounded-full text-xs font-bold text-white shadow-lg">
        <span>❌</span>
        <span>Check!</span>
      </div>
    `;
    inputElement.classList.add('field-confidence-low');
    inputElement.title = `Low confidence for ${fieldName}. Please review carefully.`;
  }

  // Make parent relative if it isn't already
  if (getComputedStyle(inputElement.parentElement).position === 'static') {
    inputElement.parentElement.style.position = 'relative';
  }

  inputElement.parentElement.insertBefore(badge, inputElement);
}

/**
 * Show overall confidence indicator
 * @param {string} confidence - Confidence level
 */
export function showConfidenceIndicator(confidence) {
  const indicator = document.getElementById('confidence-indicator-exp');
  if (!indicator) return;

  indicator.innerHTML = '';

  const indicatorDiv = document.createElement('div');
  indicatorDiv.className = 'glass rounded-2xl p-6 border-2 fade-in-up';

  if (confidence === 'high') {
    indicatorDiv.className += ' border-green-400';
    indicatorDiv.innerHTML = '<div class="flex items-center gap-4"><div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center"><svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></div><div><p class="font-bold text-lg text-green-300">High Confidence</p><p class="text-sm text-purple-200 mt-1">All details were clearly extracted from the poster</p></div></div>';
  } else if (confidence === 'medium') {
    indicatorDiv.className += ' border-yellow-400';
    indicatorDiv.innerHTML = '<div class="flex items-center gap-4"><div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"><svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></div><div><p class="font-bold text-lg text-yellow-300">Medium Confidence</p><p class="text-sm text-purple-200 mt-1">Please double-check the details below</p></div></div>';
  } else {
    indicatorDiv.className += ' border-red-400';
    indicatorDiv.innerHTML = '<div class="flex items-center gap-4"><div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center"><svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg></div><div><p class="font-bold text-lg text-red-300">Low Confidence</p><p class="text-sm text-purple-200 mt-1">We had trouble reading this poster. Please verify carefully</p></div></div>';
  }

  indicator.appendChild(indicatorDiv);
}

/**
 * Show update notification when new version is available
 * @param {ServiceWorker} worker - The waiting service worker
 */
export function showUpdateNotification(worker) {
  const updateDiv = document.createElement('div');
  updateDiv.className = 'fixed bottom-4 right-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 max-w-md animate-slide-in border border-indigo-400';
  updateDiv.innerHTML = `
    <div class="flex items-start">
      <div class="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
      </div>
      <div class="flex-1">
        <p class="font-bold text-lg">Update Available!</p>
        <p class="text-sm mt-1 text-white/90">A new version of EventSnap is ready.</p>
        <button id="update-btn" class="mt-3 px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors">
          Update Now
        </button>
        <button id="dismiss-update-btn" class="ml-2 px-4 py-2 bg-white/20 text-white rounded-lg font-semibold text-sm hover:bg-white/30 transition-colors">
          Later
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(updateDiv);

  document.getElementById('update-btn').onclick = () => {
    worker.postMessage({ type: 'SKIP_WAITING' });
    updateDiv.remove();
  };

  document.getElementById('dismiss-update-btn').onclick = () => {
    updateDiv.remove();
  };
}

/**
 * Show install prompt UI
 * @param {BeforeInstallPromptEvent} deferredPrompt - The deferred prompt event
 */
export function showInstallPrompt(deferredPrompt) {
  // Check if already dismissed
  if (localStorage.getItem('installPromptDismissed')) return;

  const installBanner = document.createElement('div');
  installBanner.id = 'install-banner';
  installBanner.className = 'fixed top-4 left-1/2 -translate-x-1/2 glass border-2 border-purple-400 px-6 py-4 rounded-2xl shadow-2xl z-50 max-w-md animate-slide-in';
  installBanner.innerHTML = `
    <div class="flex items-center gap-4">
      <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
      </div>
      <div class="flex-1">
        <p class="font-bold text-white">Install EventSnap</p>
        <p class="text-sm text-purple-200">Add to home screen for quick access</p>
      </div>
      <div class="flex gap-2">
        <button id="install-btn" class="btn-futuristic px-4 py-2 rounded-lg font-semibold text-white text-sm">
          Install
        </button>
        <button id="dismiss-install-btn" class="px-3 py-2 text-purple-300 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(installBanner);

  document.getElementById('install-btn').onclick = async () => {
    installBanner.remove();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showSuccess('EventSnap installed successfully!');
    }
  };

  document.getElementById('dismiss-install-btn').onclick = () => {
    installBanner.remove();
    localStorage.setItem('installPromptDismissed', 'true');
  };
}
