// utils/timezone.ts
export const PH_TIMEZONE = 'Asia/Manila';

/**
 * Converts an ISO UTC timestamp to Philippine Time (UTC+8)
 * Handles formats like: "2025-10-03T07:20:00.000000Z"
 */
export function isoUtcToPhilippineTime(isoString: string | null): string | null {
  if (!isoString) return null;

  try {
    // Parse the ISO string (the 'Z' indicates UTC)
    const utcDate = new Date(isoString);

    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      console.error('Invalid date:', isoString);
      return isoString;
    }

    // Convert to Philippine Time (UTC+8)
    // We can do this by creating a new date that adds 8 hours
    const phDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));

    // Format the time
    return phDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  } catch (error) {
    console.error('Error converting ISO time:', error, isoString);
    return isoString;
  }
}

/**
 * Formats a full ISO UTC timestamp to Philippine datetime
 */
export function isoUtcToPhilippineDateTime(isoString: string | null): string | null {
  if (!isoString) return null;

  try {
    const utcDate = new Date(isoString);
    if (isNaN(utcDate.getTime())) return isoString;

    const phDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));

    return phDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  } catch (error) {
    return isoString;
  }
}

/**
 * Debug function to see timezone conversions
 */
export function debugTimeConversion(isoString: string) {
  const utcDate = new Date(isoString);
  const phDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));

  console.log('⏰ Timezone Debug:', {
    input: isoString,
    utc_iso: utcDate.toISOString(),
    utc_string: utcDate.toUTCString(),
    utc_local: utcDate.toString(),
    ph_time: phDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    ph_datetime: phDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }),
  });
}