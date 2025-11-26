/**
 * Export Module
 * Handles exporting events in various formats
 */

import { generateICS } from './calendar-providers.js';
import { formatEventText, copyToClipboard } from './share.js';
import { showSuccess } from './ui.js';

/**
 * Download ICS file for the event
 * @param {Object} eventData - Event data
 */
export function downloadICS(eventData) {
  const icsContent = generateICS(eventData);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(eventData.title) || 'event'}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showSuccess('Calendar file downloaded!');
}

/**
 * Download event as JSON file
 * @param {Object} eventData - Event data
 */
export function downloadJSON(eventData) {
  const jsonContent = JSON.stringify(eventData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(eventData.title) || 'event'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showSuccess('JSON file downloaded!');
}

/**
 * Copy formatted event details to clipboard
 * @param {Object} eventData - Event data
 */
export async function copyFormattedText(eventData) {
  const text = formatEventText(eventData);
  await copyToClipboard(text);
}

/**
 * Sanitize filename by removing invalid characters
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(filename) {
  if (!filename) return '';
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length
}

/**
 * Create export dropdown menu
 * @param {Object} eventData - Event data
 * @param {HTMLElement} container - Container element for the dropdown
 */
export function createExportDropdown(eventData, container) {
  const dropdown = document.createElement('div');
  dropdown.className = 'relative inline-block';
  dropdown.innerHTML = `
    <button id="export-dropdown-btn" class="glass px-4 py-2 rounded-xl font-semibold text-purple-200 hover:text-white transition-colors flex items-center gap-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
      </svg>
      Export
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>
    <div id="export-dropdown-menu" class="hidden absolute right-0 mt-2 w-48 glass rounded-xl shadow-2xl border-2 border-purple-500/30 z-50 overflow-hidden">
      <button class="export-option w-full px-4 py-3 text-left text-purple-200 hover:bg-purple-500/20 hover:text-white transition-colors flex items-center gap-3" data-action="ics">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        Download .ics
      </button>
      <button class="export-option w-full px-4 py-3 text-left text-purple-200 hover:bg-purple-500/20 hover:text-white transition-colors flex items-center gap-3" data-action="json">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        Download .json
      </button>
      <button class="export-option w-full px-4 py-3 text-left text-purple-200 hover:bg-purple-500/20 hover:text-white transition-colors flex items-center gap-3" data-action="copy">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
        </svg>
        Copy to clipboard
      </button>
    </div>
  `;

  container.appendChild(dropdown);

  // Toggle dropdown
  const btn = dropdown.querySelector('#export-dropdown-btn');
  const menu = dropdown.querySelector('#export-dropdown-menu');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });

  // Close on outside click
  document.addEventListener('click', () => {
    menu.classList.add('hidden');
  });

  // Handle export options
  dropdown.querySelectorAll('.export-option').forEach(option => {
    option.addEventListener('click', () => {
      const action = option.dataset.action;
      menu.classList.add('hidden');

      switch (action) {
        case 'ics':
          downloadICS(eventData);
          break;
        case 'json':
          downloadJSON(eventData);
          break;
        case 'copy':
          copyFormattedText(eventData);
          break;
      }
    });
  });

  return dropdown;
}
