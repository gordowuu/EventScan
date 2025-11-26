/**
 * Share Module
 * Handles Web Share API and clipboard operations
 */

import { showSuccess, showError, showToast } from './ui.js';
import { generateICS } from './calendar-providers.js';

/**
 * Format event details as shareable text
 * @param {Object} event - Event data
 * @returns {string} - Formatted text
 */
export function formatEventText(event) {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);

  const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  const timeOptions = {
    hour: 'numeric',
    minute: '2-digit'
  };

  const dateStr = startDate.toLocaleDateString(undefined, dateOptions);
  const startTimeStr = startDate.toLocaleTimeString(undefined, timeOptions);
  const endTimeStr = endDate.toLocaleTimeString(undefined, timeOptions);

  let text = `${event.title}\n`;
  text += `${dateStr}\n`;
  text += `${startTimeStr} - ${endTimeStr}\n`;

  if (event.location) {
    text += `${event.location}\n`;
  }

  if (event.description) {
    text += `\n${event.description}`;
  }

  return text.trim();
}

/**
 * Share event using Web Share API or clipboard fallback
 * @param {Object} eventData - Event data to share
 */
export async function shareEvent(eventData) {
  const shareText = formatEventText(eventData);

  const shareData = {
    title: eventData.title,
    text: shareText
  };

  // Check if Web Share API is available
  if (navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      showSuccess('Event shared successfully!');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        // Fall back to clipboard
        await copyToClipboard(shareText);
      }
    }
  } else {
    // Fall back to clipboard
    await copyToClipboard(shareText);
  }
}

/**
 * Share event with ICS file attachment (if supported)
 * @param {Object} eventData - Event data
 */
export async function shareEventWithFile(eventData) {
  const icsContent = generateICS(eventData);
  const icsBlob = new Blob([icsContent], { type: 'text/calendar' });
  const icsFile = new File([icsBlob], `${eventData.title || 'event'}.ics`, {
    type: 'text/calendar'
  });

  const shareData = {
    title: eventData.title,
    text: formatEventText(eventData),
    files: [icsFile]
  };

  // Check if sharing files is supported
  if (navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      showSuccess('Event shared with calendar file!');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share with file failed:', error);
        // Fall back to regular share
        await shareEvent(eventData);
      }
    }
  } else {
    // Fall back to regular share
    await shareEvent(eventData);
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard!');
  } catch (error) {
    console.error('Clipboard write failed:', error);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showSuccess('Copied to clipboard!');
    } catch (e) {
      showError('Failed to copy to clipboard');
    }
    document.body.removeChild(textArea);
  }
}

/**
 * Copy formatted event details to clipboard
 * @param {Object} eventData - Event data
 */
export async function copyEventDetails(eventData) {
  const text = formatEventText(eventData);
  await copyToClipboard(text);
}
