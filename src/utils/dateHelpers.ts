// Date utility functions for the Game application

import { format, formatDistanceToNow, parseISO, differenceInDays, isValid } from 'date-fns';

/**
 * Format a date string or Date object to a human-readable string
 */
export function formatDate(date: string | Date, formatString: string = 'MMM dd, yyyy'): string {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) {
            return 'Invalid date';
        }
        return format(dateObj, formatString);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}

/**
 * Get time ago string (e.g., "2 days ago", "1 hour ago")
 */
export function getTimeAgo(date: string | Date): string {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) {
            return 'Unknown';
        }
        return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
        console.error('Error calculating time ago:', error);
        return 'Unknown';
    }
}

/**
 * Calculate days since a given date
 */
export function getDaysSince(date: string | Date): number {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) {
            return 0;
        }
        return differenceInDays(new Date(), dateObj);
    } catch (error) {
        console.error('Error calculating days since:', error);
        return 0;
    }
}

/**
 * Format date for display in different contexts
 */
export function formatDateForDisplay(date: string | Date, context: 'short' | 'medium' | 'long' = 'medium'): string {
    const formats = {
        short: 'MMM dd',
        medium: 'MMM dd, yyyy',
        long: 'MMMM dd, yyyy \'at\' h:mm a'
    };

    return formatDate(date, formats[context]);
}

/**
 * Format time for display (12h or 24h format)
 */
export function formatTime(date: string | Date, use24Hour: boolean = false): string {
    const timeFormat = use24Hour ? 'HH:mm' : 'h:mm a';
    return formatDate(date, timeFormat);
}

/**
 * Get relative date string (today, yesterday, etc.)
 */
export function getRelativeDate(date: string | Date): string {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) {
            return 'Invalid date';
        }

        const today = new Date();
        const daysDiff = differenceInDays(today, dateObj);

        if (daysDiff === 0) {
            return 'Today';
        } else if (daysDiff === 1) {
            return 'Yesterday';
        } else if (daysDiff === -1) {
            return 'Tomorrow';
        } else if (daysDiff > 1 && daysDiff <= 7) {
            return `${daysDiff} days ago`;
        } else if (daysDiff < -1 && daysDiff >= -7) {
            return `In ${Math.abs(daysDiff)} days`;
        } else {
            return formatDate(dateObj, 'MMM dd, yyyy');
        }
    } catch (error) {
        console.error('Error getting relative date:', error);
        return 'Invalid date';
    }
}

/**
 * Check if a date is within a certain number of days from now
 */
export function isWithinDays(date: string | Date, days: number): boolean {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) {
            return false;
        }

        const daysSince = Math.abs(differenceInDays(new Date(), dateObj));
        return daysSince <= days;
    } catch (error) {
        console.error('Error checking date range:', error);
        return false;
    }
}

/**
 * Get start of day for a given date
 */
export function getStartOfDay(date: string | Date = new Date()): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
}

/**
 * Get end of day for a given date
 */
export function getEndOfDay(date: string | Date = new Date()): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: string | Date, date2: string | Date): boolean {
    try {
        const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1;
        const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2;

        if (!isValid(dateObj1) || !isValid(dateObj2)) {
            return false;
        }

        return dateObj1.toDateString() === dateObj2.toDateString();
    } catch (error) {
        console.error('Error comparing dates:', error);
        return false;
    }
}

/**
 * Get date range for analytics (this week, this month, etc.)
 */
export function getDateRange(period: 'week' | 'month' | 'quarter' | 'year'): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date();

    switch (period) {
        case 'week':
            start.setDate(now.getDate() - 7);
            break;
        case 'month':
            start.setMonth(now.getMonth() - 1);
            break;
        case 'quarter':
            start.setMonth(now.getMonth() - 3);
            break;
        case 'year':
            start.setFullYear(now.getFullYear() - 1);
            break;
    }

    return { start, end: now };
}

/**
 * Convert date to ISO string safely
 */
export function toISOString(date: string | Date): string {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) {
            return new Date().toISOString();
        }
        return dateObj.toISOString();
    } catch (error) {
        console.error('Error converting to ISO string:', error);
        return new Date().toISOString();
    }
}