// Utility functions for meeting link generation and Google Calendar integration

/**
 * Generate a Google Meet link
 * @param {string} title - Meeting title
 * @param {Date} startTime - Meeting start time
 * @param {number} duration - Meeting duration in minutes
 * @returns {string} Google Meet link
 */
export const generateGoogleMeetLink = (title, startTime, duration) => {
  // Generate a unique meeting ID (12 characters)
  const meetingId = Math.random().toString(36).substring(2, 8) + 
                   Math.random().toString(36).substring(2, 8);
  
  // Format the meeting link
  return `https://meet.google.com/${meetingId}`;
};

/**
 * Generate a Zoom link
 * @param {string} title - Meeting title
 * @param {Date} startTime - Meeting start time
 * @param {number} duration - Meeting duration in minutes
 * @returns {string} Zoom link
 */
export const generateZoomLink = (title, startTime, duration) => {
  // Generate a unique meeting ID (11 digits)
  const meetingId = Math.floor(Math.random() * 90000000000) + 10000000000;
  const password = Math.random().toString(36).substring(2, 6);
  
  return `https://zoom.us/j/${meetingId}?pwd=${password}`;
};

/**
 * Generate a Teams link
 * @param {string} title - Meeting title
 * @param {Date} startTime - Meeting start time
 * @param {number} duration - Meeting duration in minutes
 * @returns {string} Teams link
 */
export const generateTeamsLink = (title, startTime, duration) => {
  // Generate a unique meeting ID
  const meetingId = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
  
  return `https://teams.microsoft.com/l/meetup-join/19:meeting_${meetingId}`;
};

/**
 * Generate meeting link based on platform preference
 * @param {string} platform - Meeting platform ('google', 'zoom', 'teams')
 * @param {string} title - Meeting title
 * @param {Date} startTime - Meeting start time
 * @param {number} duration - Meeting duration in minutes
 * @returns {string} Meeting link
 */
export const generateMeetingLink = (platform = 'google', title, startTime, duration) => {
  switch (platform.toLowerCase()) {
    case 'zoom':
      return generateZoomLink(title, startTime, duration);
    case 'teams':
      return generateTeamsLink(title, startTime, duration);
    case 'google':
    default:
      return generateGoogleMeetLink(title, startTime, duration);
  }
};

/**
 * Create Google Calendar event URL
 * @param {Object} eventData - Event data
 * @param {string} eventData.title - Event title
 * @param {Date} eventData.startTime - Event start time
 * @param {number} eventData.duration - Event duration in minutes
 * @param {string} eventData.description - Event description
 * @param {string} eventData.location - Event location or meeting link
 * @param {Array} eventData.attendees - Array of attendee emails
 * @returns {string} Google Calendar URL
 */
export const createGoogleCalendarEvent = (eventData) => {
  const {
    title,
    startTime,
    duration,
    description = '',
    location = '',
    attendees = []
  } = eventData;

  // Calculate end time
  const endTime = new Date(startTime.getTime() + duration * 60000);

  // Format dates for Google Calendar
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  // Build the URL
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDate(startTime)}/${formatDate(endTime)}`,
    details: description,
    location: location,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  // Add attendees if provided
  if (attendees.length > 0) {
    params.append('add', attendees.join(','));
  }

  return `${baseUrl}?${params.toString()}`;
};

/**
 * Create Outlook Calendar event URL
 * @param {Object} eventData - Event data
 * @param {string} eventData.title - Event title
 * @param {Date} eventData.startTime - Event start time
 * @param {number} eventData.duration - Event duration in minutes
 * @param {string} eventData.description - Event description
 * @param {string} eventData.location - Event location or meeting link
 * @param {Array} eventData.attendees - Array of attendee emails
 * @returns {string} Outlook Calendar URL
 */
export const createOutlookCalendarEvent = (eventData) => {
  const {
    title,
    startTime,
    duration,
    description = '',
    location = '',
    attendees = []
  } = eventData;

  // Calculate end time
  const endTime = new Date(startTime.getTime() + duration * 60000);

  // Format dates for Outlook
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  // Build the URL
  const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
  const params = new URLSearchParams({
    subject: title,
    startdt: startTime.toISOString(),
    enddt: endTime.toISOString(),
    body: description,
    location: location,
    path: '/calendar/action/compose',
    rru: 'addevent'
  });

  // Add attendees if provided
  if (attendees.length > 0) {
    params.append('to', attendees.join(','));
  }

  return `${baseUrl}?${params.toString()}`;
};

/**
 * Create calendar event URL based on user's preferred calendar
 * @param {string} calendarType - Calendar type ('google', 'outlook')
 * @param {Object} eventData - Event data
 * @returns {string} Calendar event URL
 */
export const createCalendarEvent = (calendarType = 'google', eventData) => {
  switch (calendarType.toLowerCase()) {
    case 'outlook':
      return createOutlookCalendarEvent(eventData);
    case 'google':
    default:
      return createGoogleCalendarEvent(eventData);
  }
};

/**
 * Format meeting link for display
 * @param {string} link - Meeting link
 * @param {string} platform - Meeting platform
 * @returns {Object} Formatted meeting data
 */
export const formatMeetingLink = (link, platform = 'google') => {
  const platforms = {
    google: {
      name: 'Google Meet',
      icon: '🎥',
      color: 'text-blue-600'
    },
    zoom: {
      name: 'Zoom',
      icon: '📹',
      color: 'text-blue-500'
    },
    teams: {
      name: 'Microsoft Teams',
      icon: '💼',
      color: 'text-purple-600'
    }
  };

  const platformInfo = platforms[platform.toLowerCase()] || platforms.google;

  return {
    link,
    platform: platformInfo.name,
    icon: platformInfo.icon,
    color: platformInfo.color
  };
}; 