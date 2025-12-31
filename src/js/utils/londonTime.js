/**
 * London Timezone Utility Module
 * Centralizes all London/Europe/London timezone operations with automatic DST support
 */

/**
 * Get current moment in London timezone
 * @returns {Date} Date object representing current time in London
 */
export const getLondonNow = () => {
  return new Date();
};

/**
 * Get today's date at midnight in London timezone
 * @returns {Date} Date object set to 00:00:00 in London timezone
 */
export const getLondonToday = () => {
  const now = new Date();
  const londonDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  londonDate.setHours(0, 0, 0, 0);
  return londonDate;
};

/**
 * Convert any Date to represent its London timezone value
 * @param {Date} date - The date to convert
 * @returns {Date} Date object representing the input as London time
 */
export const convertToLondonTime = (date) => {
  if (!date || !(date instanceof Date)) {
    return null;
  }
  return new Date(date.toLocaleString('en-US', { timeZone: 'Europe/London' }));
};

/**
 * Parse a date string in London timezone context
 * Handles formats like "Dec 07, 2025", "2025-12-07", "12/07/2025"
 * @param {string} dateStr - Date string to parse
 * @returns {Date} Date object in London timezone or null if invalid
 */
export const parseDateAsLondon = (dateStr) => {
  if (!dateStr) return null;

  try {
    const raw = dateStr.toString().trim();

    // Handle common UK numeric formats reliably (DD/MM/YYYY or DD-MM-YYYY).
    // Native Date parsing is locale-dependent and can misinterpret these.
    const match = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\b|\s)/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);

      if (
        Number.isFinite(day) &&
        Number.isFinite(month) &&
        Number.isFinite(year) &&
        day >= 1 &&
        day <= 31 &&
        month >= 1 &&
        month <= 12
      ) {
        // Create a date at midday to avoid DST edge cases when converting timezones.
        const date = new Date(year, month - 1, day, 12, 0, 0, 0);
        if (!isNaN(date.getTime())) {
          return new Date(date.toLocaleString('en-US', { timeZone: 'Europe/London' }));
        }
      }
    }

    // Fallback: parse the date string as-is.
    const date = new Date(raw);
    if (isNaN(date.getTime())) {
      return null;
    }

    // Convert to London timezone representation
    return new Date(date.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  } catch {
    return null;
  }
};

/**
 * Format a date for display in en-GB with London timezone
 * @param {Date} date - Date to format
 * @param {string} format - Format type: 'short' (Dec 07, 2025), 'date' (DD/MM/YYYY), 'time' (HH:MM:SS), 'full'
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (date, format = 'short') => {
  if (!date || !(date instanceof Date)) {
    return '';
  }

  const londonDate = convertToLondonTime(date);

  switch (format) {
    case 'short':
      return londonDate.toLocaleDateString('en-GB', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
    case 'date':
      return londonDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    case 'time':
      return londonDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    case 'full':
      return londonDate.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    default:
      return londonDate.toLocaleDateString('en-GB');
  }
};

/**
 * Get date ranges in London timezone
 * @param {string} type - Range type: 'today', 'last7days', 'last30days', 'last90days', 'thisMonth', 'thisYear'
 * @returns {{start: Date, end: Date}} Object with start and end dates
 */
export const getDateRange = (type) => {
  const end = getLondonToday();
  end.setHours(23, 59, 59, 999);
  
  let start = new Date(end);
  start.setHours(0, 0, 0, 0);

  switch (type) {
    case 'today':
      return { start, end };
    
    case 'last7days':
      start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    
    case 'last30days':
      start = new Date(end);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    
    case 'last90days':
      start = new Date(end);
      start.setDate(start.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    
    case 'thisMonth':
      start = new Date(end);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    
    case 'thisYear':
      start = new Date(end);
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    
    default:
      return { start, end };
  }
};

/**
 * Check if a date is expired relative to London's current date
 * @param {Date|string} expiryDate - Date to check
 * @returns {boolean} True if the date is in the past
 */
export const isExpired = (expiryDate) => {
  if (!expiryDate) return false;

  const expiry = expiryDate instanceof Date ? expiryDate : parseDateAsLondon(expiryDate);
  if (!expiry) return false;

  const londonToday = getLondonToday();
  return expiry < londonToday;
};

/**
 * Get difference between two dates in specified unit
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @param {string} unit - Unit: 'days', 'hours', 'minutes', 'seconds'
 * @returns {number} Difference in specified unit (negative if date1 is after date2)
 */
export const getDateDifference = (date1, date2, unit = 'days') => {
  if (!date1 || !date2) return 0;

  const d1 = convertToLondonTime(date1);
  const d2 = convertToLondonTime(date2);

  const diffMs = d1 - d2;

  switch (unit) {
    case 'days':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case 'hours':
      return Math.floor(diffMs / (1000 * 60 * 60));
    case 'minutes':
      return Math.floor(diffMs / (1000 * 60));
    case 'seconds':
      return Math.floor(diffMs / 1000);
    default:
      return diffMs;
  }
};

/**
 * Compare two dates in London timezone
 * @param {Date|string} dateA - First date
 * @param {Date|string} dateB - Second date
 * @returns {number} -1 if A < B, 0 if equal, 1 if A > B
 */
export const compareLondonDates = (dateA, dateB) => {
  const a = dateA instanceof Date ? dateA : parseDateAsLondon(dateA);
  const b = dateB instanceof Date ? dateB : parseDateAsLondon(dateB);

  if (!a || !b) return 0;

  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

/**
 * Get array of dates for a specific range (useful for chart x-axis)
 * @param {string} rangeType - 'last7days', 'last30days', 'thisMonth'
 * @returns {Date[]} Array of dates in the range
 */
export const getDateArray = (rangeType) => {
  const range = getDateRange(rangeType);
  const dates = [];
  const current = new Date(range.start);
  current.setHours(0, 0, 0, 0);

  while (current <= range.end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/**
 * Get start of day in London timezone
 * @param {Date} date - Date to get start of day for
 * @returns {Date} Date set to 00:00:00 in London timezone
 */
export const getStartOfDay = (date) => {
  const londonDate = convertToLondonTime(date);
  londonDate.setHours(0, 0, 0, 0);
  return londonDate;
};

/**
 * Get end of day in London timezone
 * @param {Date} date - Date to get end of day for
 * @returns {Date} Date set to 23:59:59 in London timezone
 */
export const getEndOfDay = (date) => {
  const londonDate = convertToLondonTime(date);
  londonDate.setHours(23, 59, 59, 999);
  return londonDate;
};
