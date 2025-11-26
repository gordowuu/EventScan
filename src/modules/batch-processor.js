/**
 * Batch Processor Module
 * Handles processing multiple images at once
 */

import { compressImage, blobToBase64, createPreview, validateImage } from './image-processor.js';
import { showToast, showError, showSuccess, updateProcessingStatus } from './ui.js';

/**
 * Batch processor class for handling multiple images
 */
export class BatchProcessor {
  constructor(parseEventImage) {
    this.queue = [];
    this.results = [];
    this.currentIndex = 0;
    this.parseEventImage = parseEventImage;
    this.onProgress = null;
    this.onComplete = null;
  }

  /**
   * Add files to the processing queue
   * @param {FileList|File[]} files - Files to add
   */
  async addFiles(files) {
    for (const file of files) {
      const validation = validateImage(file);
      if (validation.valid) {
        const preview = await createPreview(file);
        this.queue.push({
          file,
          preview,
          status: 'pending',
          result: null,
          error: null
        });
      } else {
        showError(`${file.name}: ${validation.error}`);
      }
    }
    return this.queue.length;
  }

  /**
   * Process all files in the queue
   * @returns {Promise<Object[]>} - Array of results
   */
  async processAll() {
    this.results = [];
    this.currentIndex = 0;

    for (let i = 0; i < this.queue.length; i++) {
      this.currentIndex = i;
      const item = this.queue[i];

      // Update progress
      if (this.onProgress) {
        this.onProgress(i + 1, this.queue.length, item);
      }

      try {
        item.status = 'processing';
        const result = await this.processSingle(item.file);
        item.status = 'completed';
        item.result = result;
        this.results.push({
          file: item.file,
          preview: item.preview,
          eventData: result,
          success: true
        });
      } catch (error) {
        console.error(`Error processing ${item.file.name}:`, error);
        item.status = 'error';
        item.error = error.message || 'Processing failed';
        this.results.push({
          file: item.file,
          preview: item.preview,
          eventData: null,
          success: false,
          error: item.error
        });
      }
    }

    if (this.onComplete) {
      this.onComplete(this.results);
    }

    return this.results;
  }

  /**
   * Process a single file
   * @param {File} file - File to process
   * @returns {Promise<Object>} - Event data
   */
  async processSingle(file) {
    // Compress image
    const compressedImage = await compressImage(file);

    // Convert to base64
    const imageData = await blobToBase64(compressedImage);

    // Call API
    const result = await this.parseEventImage({
      imageData: imageData.split(',')[1],
      mimeType: compressedImage.type
    });

    return result.data.eventData;
  }

  /**
   * Get queue length
   * @returns {number}
   */
  get length() {
    return this.queue.length;
  }

  /**
   * Clear the queue and results
   */
  clear() {
    this.queue = [];
    this.results = [];
    this.currentIndex = 0;
  }

  /**
   * Get successful results
   * @returns {Object[]}
   */
  getSuccessful() {
    return this.results.filter(r => r.success);
  }

  /**
   * Get failed results
   * @returns {Object[]}
   */
  getFailed() {
    return this.results.filter(r => !r.success);
  }
}

/**
 * Render batch results grid
 * @param {Object[]} results - Processing results
 * @param {HTMLElement} container - Container element
 * @param {Function} onAddToCalendar - Callback when adding to calendar
 */
export function renderBatchResults(results, container, onAddToCalendar) {
  container.innerHTML = '';

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  // Summary header
  const summary = document.createElement('div');
  summary.className = 'mb-6 text-center';
  summary.innerHTML = `
    <div class="text-6xl mb-4">${successCount > 0 ? '🎉' : '😕'}</div>
    <h2 class="text-3xl font-bold mb-2 neon-glow">Batch Processing Complete</h2>
    <p class="text-purple-200">
      <span class="text-green-400 font-semibold">${successCount}</span> events extracted
      ${failCount > 0 ? `<span class="mx-2">|</span> <span class="text-red-400 font-semibold">${failCount}</span> failed` : ''}
    </p>
  `;
  container.appendChild(summary);

  // Results grid
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6';

  results.forEach((result, index) => {
    const card = document.createElement('div');
    card.className = `glass rounded-2xl p-4 border-2 transition-all hover:scale-[1.02] ${result.success ? 'border-purple-500/30 hover:border-purple-400' : 'border-red-500/30'}`;

    if (result.success) {
      const event = result.eventData;
      const startDate = new Date(event.start_time);

      card.innerHTML = `
        <div class="flex gap-4">
          <img src="${result.preview}" alt="Poster" class="w-20 h-20 object-cover rounded-lg flex-shrink-0">
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-white truncate">${event.title || 'Untitled Event'}</h3>
            <p class="text-sm text-purple-200 mt-1">📅 ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            ${event.location ? `<p class="text-sm text-purple-300 truncate mt-1">📍 ${event.location}</p>` : ''}
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button class="add-to-calendar-btn flex-1 btn-futuristic py-2 px-4 rounded-lg text-sm font-semibold text-white relative z-10" data-index="${index}">
            📅 Add
          </button>
          <button class="view-details-btn btn-edit-hover glass py-2 px-4 rounded-lg text-sm font-semibold text-purple-200 hover:text-white border-2 border-purple-500/30" data-index="${index}">
            <span class="relative z-10">✏️ Edit</span>
          </button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="flex gap-4">
          <img src="${result.preview}" alt="Poster" class="w-20 h-20 object-cover rounded-lg flex-shrink-0 opacity-50">
          <div class="flex-1">
            <h3 class="font-bold text-red-300">❌ Processing Failed</h3>
            <p class="text-sm text-red-200 mt-1">${result.error || 'Could not extract event details'}</p>
          </div>
        </div>
      `;
    }

    grid.appendChild(card);
  });

  container.appendChild(grid);

  // Add event listeners for add to calendar buttons
  container.querySelectorAll('.add-to-calendar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      const result = results[index];
      if (result.success && onAddToCalendar) {
        onAddToCalendar(result.eventData);
      }
    });
  });

  // Add event listeners for view/edit details buttons
  container.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      const result = results[index];
      if (result.success) {
        showEventDetailsModal(result, index, results, onAddToCalendar);
      }
    });
  });

  // Add "Add All" button if there are successful results
  if (successCount > 1) {
    const addAllSection = document.createElement('div');
    addAllSection.className = 'text-center';
    addAllSection.innerHTML = `
      <button id="add-all-btn" class="btn-futuristic py-4 px-8 rounded-xl font-bold text-white text-lg relative overflow-hidden">
        <span class="relative z-10">📅 Add All ${successCount} Events to Calendar</span>
      </button>
    `;
    container.appendChild(addAllSection);

    document.getElementById('add-all-btn').addEventListener('click', () => {
      results.filter(r => r.success).forEach(result => {
        if (onAddToCalendar) {
          onAddToCalendar(result.eventData);
        }
      });
      showSuccess(`${successCount} events added to calendar!`);
    });
  }
}

/**
 * Show event details modal for viewing/editing
 * @param {Object} result - The event result
 * @param {number} index - Index in results array
 * @param {Object[]} results - All results
 * @param {Function} onAddToCalendar - Calendar callback
 */
function showEventDetailsModal(result, index, results, onAddToCalendar) {
  const event = result.eventData;

  // Format dates for input fields
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().slice(0, 16);
  };

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  modal.innerHTML = `
    <div class="glass rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in border-2 border-purple-500/30">
      <div class="p-6 md:p-8">
        <div class="flex justify-between items-start mb-6">
          <h2 class="text-2xl font-bold neon-glow">Edit Event Details</h2>
          <button class="close-modal text-purple-300 hover:text-white p-2 -mr-2 -mt-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Poster preview -->
          <div>
            <img src="${result.preview}" alt="Poster" class="w-full rounded-xl border-2 border-purple-500/30">
          </div>

          <!-- Edit form -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-purple-200 mb-2">📝 Event Title</label>
              <input type="text" id="modal-title-${index}" value="${event.title || ''}" class="w-full glass px-4 py-3 rounded-xl border-2 border-purple-500/30 text-white">
            </div>

            <div>
              <label class="block text-sm font-bold text-purple-200 mb-2">📅 Start Time</label>
              <input type="datetime-local" id="modal-start-${index}" value="${formatDateForInput(event.start_time)}" class="w-full glass px-4 py-3 rounded-xl border-2 border-purple-500/30 text-white">
            </div>

            <div>
              <label class="block text-sm font-bold text-purple-200 mb-2">🏁 End Time</label>
              <input type="datetime-local" id="modal-end-${index}" value="${formatDateForInput(event.end_time)}" class="w-full glass px-4 py-3 rounded-xl border-2 border-purple-500/30 text-white">
            </div>

            <div>
              <label class="block text-sm font-bold text-purple-200 mb-2">📍 Location</label>
              <input type="text" id="modal-location-${index}" value="${event.location || ''}" class="w-full glass px-4 py-3 rounded-xl border-2 border-purple-500/30 text-white">
            </div>

            <div>
              <label class="block text-sm font-bold text-purple-200 mb-2">📄 Description</label>
              <textarea id="modal-description-${index}" rows="3" class="w-full glass px-4 py-3 rounded-xl border-2 border-purple-500/30 text-white resize-none">${event.description || ''}</textarea>
            </div>
          </div>
        </div>

        <div class="flex gap-4 mt-6">
          <button class="save-changes flex-1 glass py-3 px-6 rounded-xl font-bold text-purple-200 hover:text-white border-2 border-purple-500/30 hover:border-purple-400 transition-all">
            💾 Save Changes
          </button>
          <button class="add-to-cal flex-1 btn-futuristic py-3 px-6 rounded-xl font-bold text-white relative z-10">
            📅 Add to Calendar
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close button
  modal.querySelector('.close-modal').onclick = () => modal.remove();

  // Save changes
  modal.querySelector('.save-changes').onclick = () => {
    // Update the event data
    event.title = document.getElementById(`modal-title-${index}`).value;
    event.start_time = document.getElementById(`modal-start-${index}`).value;
    event.end_time = document.getElementById(`modal-end-${index}`).value;
    event.location = document.getElementById(`modal-location-${index}`).value;
    event.description = document.getElementById(`modal-description-${index}`).value;

    // Update the results array
    results[index].eventData = event;

    showSuccess('Changes saved!');
    modal.remove();

    // Re-render results to show updated data
    const container = document.getElementById('batch-results-container');
    if (container) {
      renderBatchResults(results, container, onAddToCalendar);
    }
  };

  // Add to calendar
  modal.querySelector('.add-to-cal').onclick = () => {
    // Save changes first
    event.title = document.getElementById(`modal-title-${index}`).value;
    event.start_time = document.getElementById(`modal-start-${index}`).value;
    event.end_time = document.getElementById(`modal-end-${index}`).value;
    event.location = document.getElementById(`modal-location-${index}`).value;
    event.description = document.getElementById(`modal-description-${index}`).value;

    if (onAddToCalendar) {
      onAddToCalendar(event);
    }
    modal.remove();
  };
}

/**
 * Create batch processing progress UI
 * @param {HTMLElement} container - Container element
 * @returns {Object} - Progress update functions
 */
export function createBatchProgressUI(container) {
  container.innerHTML = `
    <div class="glass rounded-3xl p-12 text-center scan-line">
      <!-- Classic Spinning Wheel Loader (like old version) -->
      <div role="status" class="mb-8 relative">
        <div class="spinner-glow-container pulse-glow">
          <svg aria-hidden="true" class="w-16 h-16 text-white classic-spinner" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" fill-opacity="0.3"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5424 39.6781 93.9676 39.0409Z" fill="currentColor"/>
          </svg>
        </div>
        <span class="sr-only">Processing...</span>
      </div>

      <h3 class="text-3xl font-bold mb-4 neon-glow">Processing Events</h3>
      <p id="batch-progress-message" class="text-xl text-purple-200 mb-2">
        <span class="processing-emoji">📸</span> Preparing...
      </p>
      <p id="batch-progress-count" class="text-lg font-bold text-purple-300 mb-4">0/0</p>

      <!-- Processing dots -->
      <div class="processing-dots mb-6">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div class="max-w-md mx-auto">
        <div class="h-3 bg-purple-900/30 rounded-full overflow-hidden">
          <div id="batch-progress-bar" class="h-full progress-bar-animated rounded-full transition-all duration-500" style="width: 0%"></div>
        </div>
        <p class="text-xs text-purple-300 mt-3">Processing multiple posters with AI</p>
      </div>

      <div id="batch-thumbnails" class="flex justify-center gap-2 mt-6 flex-wrap max-w-md mx-auto"></div>

      <!-- Animated dots -->
      <div class="mt-6 flex items-center justify-center gap-2">
        <div class="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        <div class="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
        <div class="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
      </div>
    </div>
  `;

  return {
    updateProgress: (current, total, item) => {
      document.getElementById('batch-progress-count').textContent = `${current}/${total}`;

      // Calculate percentage
      const percent = Math.round((current / total) * 100);
      document.getElementById('batch-progress-bar').style.width = `${percent}%`;

      // Update message with emoji
      const filename = item?.file?.name || 'image';
      const shortName = filename.length > 20 ? filename.substring(0, 17) + '...' : filename;
      document.getElementById('batch-progress-message').innerHTML = `
        <span class="processing-emoji">🤖</span> Processing ${shortName} (${current}/${total})
      `;
    },
    addThumbnail: (preview, status) => {
      const thumb = document.createElement('div');
      thumb.className = `w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
        status === 'completed' ? 'border-green-400 shadow-lg shadow-green-400/30' :
        status === 'error' ? 'border-red-400 shadow-lg shadow-red-400/30' :
        status === 'processing' ? 'border-purple-400 animate-pulse shadow-lg shadow-purple-400/30' :
        'border-purple-500/30'
      }`;
      thumb.innerHTML = `<img src="${preview}" class="w-full h-full object-cover ${status === 'error' ? 'opacity-50 grayscale' : ''}">`;
      document.getElementById('batch-thumbnails').appendChild(thumb);
    },
    updateThumbnail: (index, status) => {
      const thumbs = document.getElementById('batch-thumbnails').children;
      if (thumbs[index]) {
        thumbs[index].className = `w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
          status === 'completed' ? 'border-green-400 shadow-lg shadow-green-400/30' :
          status === 'error' ? 'border-red-400 shadow-lg shadow-red-400/30' :
          'border-purple-500/30'
        }`;
        if (status === 'error') {
          thumbs[index].querySelector('img').classList.add('opacity-50', 'grayscale');
        }
      }
    }
  };
}
