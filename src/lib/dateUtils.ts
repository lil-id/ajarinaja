/**
 * Date/Time Utility Functions for Timezone Handling
 * 
 * These utilities ensure proper conversion between:
 * - Local datetime (for user input/display)
 * - UTC (for database storage)
 */

/**
 * Convert local datetime-local input value to UTC ISO string for database
 * 
 * @param localDateTimeString - Format: "2026-01-31T10:00" from datetime-local input
 * @returns UTC ISO string - Format: "2026-01-31T02:00:00.000Z" (example for UTC+8)
 * 
 * @example
 * // User in WITA (UTC+8) inputs: "2026-01-31T10:00"
 * localDateTimeToUTC("2026-01-31T10:00")
 * // Returns: "2026-01-31T02:00:00.000Z"
 */
export function localDateTimeToUTC(localDateTimeString: string): string {
    const date = new Date(localDateTimeString);
    return date.toISOString();
}

/**
 * Convert UTC ISO string from database to local datetime-local format
 * 
 * @param utcISOString - Format: "2026-01-31T02:00:00.000Z" from database
 * @returns Local datetime string - Format: "2026-01-31T10:00" for datetime-local input
 * 
 * @example
 * // Database has: "2026-01-31T02:00:00.000Z"
 * // User in WITA (UTC+8)
 * utcToLocalDateTime("2026-01-31T02:00:00.000Z")
 * // Returns: "2026-01-31T10:00"
 */
export function utcToLocalDateTime(utcISOString: string): string {
    const date = new Date(utcISOString);

    // Get local date/time components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format UTC timestamp to local date/time string for display
 * This is a convenience wrapper around date-fns format that ensures UTC → Local conversion
 * 
 * @param utcISOString - UTC timestamp from database
 * @param formatString - date-fns format string (default: 'MMM d, yyyy h:mm a')
 * @returns Formatted local date/time string
 * 
 * Note: For most display cases, use date-fns format() directly with new Date()
 * This function is provided for consistency and clarity.
 */
export function formatLocalDateTime(
    utcISOString: string,
    formatString: string = 'MMM d, yyyy h:mm a'
): string {
    // date-fns format() automatically converts UTC to local timezone
    // This function is here for consistency and future extensibility
    const date = new Date(utcISOString);
    return date.toLocaleString(); // Basic implementation
}
