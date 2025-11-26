/**
 * Calendar Providers Module
 * Handles calendar URL/file generation for Google, Apple, Outlook, Yahoo
 */

/**
 * Format date for calendar URLs (YYYYMMDDTHHMMSSZ)
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
export function formatCalendarDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
}

/**
 * Convert recurring event info to RRULE format
 * @param {Object} recurringData - Recurring event data
 * @param {string} startTime - Event start time
 * @returns {string|null} - RRULE string or null
 */
export function generateRRule(recurringData, startTime) {
  if (!recurringData?.is_recurring || !recurringData.frequency) {
    return null;
  }

  const frequency = recurringData.frequency.toUpperCase();
  const pattern = recurringData.pattern || '';
  const startDate = new Date(startTime);

  // Map frequency to RRULE FREQ values
  const freqMap = {
    'DAILY': 'DAILY',
    'WEEKLY': 'WEEKLY',
    'MONTHLY': 'MONTHLY',
    'YEARLY': 'YEARLY',
    'CUSTOM': 'WEEKLY'
  };

  const freq = freqMap[frequency] || 'WEEKLY';
  let rrule = `FREQ=${freq}`;

  // For weekly events, parse multiple days from pattern
  if (freq === 'WEEKLY') {
    const dayMap = {
      'sunday': 'SU', 'sun': 'SU',
      'monday': 'MO', 'mon': 'MO',
      'tuesday': 'TU', 'tue': 'TU', 'tues': 'TU',
      'wednesday': 'WE', 'wed': 'WE',
      'thursday': 'TH', 'thu': 'TH', 'thur': 'TH', 'thurs': 'TH',
      'friday': 'FR', 'fri': 'FR',
      'saturday': 'SA', 'sat': 'SA'
    };

    const patternLower = pattern.toLowerCase();
    const foundDays = [];

    for (const [dayName, dayCode] of Object.entries(dayMap)) {
      if (patternLower.includes(dayName)) {
        if (!foundDays.includes(dayCode)) {
          foundDays.push(dayCode);
        }
      }
    }

    if (foundDays.length > 0) {
      const weekOrder = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      foundDays.sort((a, b) => weekOrder.indexOf(a) - weekOrder.indexOf(b));
      rrule += `;BYDAY=${foundDays.join(',')}`;
    } else {
      const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const dayOfWeek = days[startDate.getDay()];
      rrule += `;BYDAY=${dayOfWeek}`;
    }
  }

  if (freq === 'MONTHLY') {
    const dayOfMonth = startDate.getDate();
    rrule += `;BYMONTHDAY=${dayOfMonth}`;
  }

  return rrule;
}

/**
 * Generate Google Calendar URL
 * @param {Object} eventDetails - Event details object
 * @returns {string} - Google Calendar URL
 */
export function generateGoogleCalendarURL(eventDetails) {
  const baseURL = "https://www.google.com/calendar/render?action=TEMPLATE";

  const params = new URLSearchParams({
    text: eventDetails.title || 'New Event',
    dates: `${formatCalendarDate(eventDetails.startTime)}/${formatCalendarDate(eventDetails.endTime)}`,
    details: eventDetails.description || '',
    location: eventDetails.location || ''
  });

  if (eventDetails.recurring) {
    const rrule = generateRRule(eventDetails.recurring, eventDetails.startTime);
    if (rrule) {
      params.append('recur', `RRULE:${rrule}`);
    }
  }

  return `${baseURL}&${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 * @param {Object} eventDetails - Event details object
 * @returns {string} - Outlook Calendar URL
 */
export function generateOutlookURL(eventDetails) {
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

  if (eventDetails.recurring?.is_recurring) {
    const freq = eventDetails.recurring.frequency?.toUpperCase();
    if (freq === 'DAILY' || freq === 'WEEKLY' || freq === 'MONTHLY') {
      params.append('recurrence', freq.toLowerCase());
    }
  }

  return `${baseURL}?${params.toString()}`;
}

/**
 * Generate Yahoo Calendar URL
 * @param {Object} eventDetails - Event details object
 * @returns {string} - Yahoo Calendar URL
 */
export function generateYahooURL(eventDetails) {
  const baseURL = "https://calendar.yahoo.com/";

  const startDate = new Date(eventDetails.startTime);
  const endDate = new Date(eventDetails.endTime);

  // Yahoo uses a different date format
  const st = startDate.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const et = endDate.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

  const params = new URLSearchParams({
    v: '60',
    title: eventDetails.title || 'New Event',
    st: st,
    et: et,
    desc: eventDetails.description || '',
    in_loc: eventDetails.location || ''
  });

  return `${baseURL}?${params.toString()}`;
}

/**
 * Generate ICS file content for Apple Calendar and others
 * @param {Object} eventDetails - Event details object
 * @returns {string} - ICS file content
 */
export function generateICS(eventDetails) {
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

  const rrule = eventDetails.recurring ? generateRRule(eventDetails.recurring, eventDetails.startTime) : null;

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
LOCATION:${escapeICS(eventDetails.location)}${rrule ? '\nRRULE:' + rrule : ''}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

/**
 * Check if user is on mobile
 * @returns {boolean}
 */
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768;
}

/**
 * Show mobile helper toast for calendar redirect
 * @param {string} calendarName - Name of the calendar app
 */
function showMobileCalendarHelper(calendarName) {
  if (!isMobile()) return;

  // Create helper toast
  const helper = document.createElement('div');
  helper.className = 'fixed bottom-20 left-4 right-4 glass border-2 border-purple-400 px-6 py-4 rounded-2xl shadow-2xl z-50 animate-slide-in';
  helper.innerHTML = `
    <div class="flex items-start gap-4">
      <div class="text-3xl">📅</div>
      <div class="flex-1">
        <p class="font-bold text-white mb-1">${calendarName} Opened!</p>
        <p class="text-sm text-purple-200">After adding the event, swipe back or tap here to return to EventSnap</p>
      </div>
      <button onclick="this.closest('.fixed').remove()" class="text-purple-300 hover:text-white">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(helper);

  // Remove after 10 seconds
  setTimeout(() => helper.remove(), 10000);
}

/**
 * Open Google Calendar with pre-filled event
 * @param {Object} eventDetails - Event details
 */
export function openGoogleCalendar(eventDetails) {
  const url = generateGoogleCalendarURL(eventDetails);

  if (isMobile()) {
    // On mobile, open in same tab for better UX
    window.location.href = url;
    showMobileCalendarHelper('Google Calendar');
  } else {
    window.open(url, '_blank', 'width=800,height=600');
  }
}

/**
 * Open Apple Calendar (download ICS file)
 * @param {Object} eventDetails - Event details
 */
export function openAppleCalendar(eventDetails) {
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
}

/**
 * Open Outlook Calendar
 * @param {Object} eventDetails - Event details
 */
export function openOutlookCalendar(eventDetails) {
  const url = generateOutlookURL(eventDetails);

  if (isMobile()) {
    window.location.href = url;
    showMobileCalendarHelper('Outlook');
  } else {
    window.open(url, '_blank', 'width=800,height=600');
  }
}

/**
 * Open Yahoo Calendar
 * @param {Object} eventDetails - Event details
 */
export function openYahooCalendar(eventDetails) {
  const url = generateYahooURL(eventDetails);

  if (isMobile()) {
    window.location.href = url;
    showMobileCalendarHelper('Yahoo Calendar');
  } else {
    window.open(url, '_blank', 'width=800,height=600');
  }
}
