// Temperature calculation utilities for leads

import { Lead, Interaction, Temperature } from '../types';
import { getDaysSince, isWithinDays } from './dateHelpers';
import { TEMPERATURE_THRESHOLDS } from './constants';

/**
 * Calculate the temperature of a lead based on interaction patterns
 */
export function calculateLeadTemperature(
    lead: Lead,
    interactions: Interaction[],
    customThresholds?: Partial<typeof TEMPERATURE_THRESHOLDS>
): Temperature {
    const thresholds = { ...TEMPERATURE_THRESHOLDS, ...customThresholds };

    // If no last interaction, it's cold
    if (!lead.lastInteractionDate) {
        return 'Cold';
    }

    // Calculate days since last interaction
    const daysSinceLastInteraction = getDaysSince(lead.lastInteractionDate);

    // Count recent interactions (within the recent window)
    const recentInteractions = interactions.filter(interaction =>
        interaction.leadId === lead.id &&
        isWithinDays(interaction.occurredAt, thresholds.RECENT_INTERACTION_WINDOW_DAYS)
    );

    // Calculate temperature based on recency and frequency
    if (daysSinceLastInteraction <= thresholds.HOT_MAX_DAYS_SINCE_LAST &&
        recentInteractions.length >= thresholds.HOT_MIN_INTERACTIONS) {
        return 'Hot';
    } else if (daysSinceLastInteraction <= thresholds.COLD_AFTER_DAYS &&
        recentInteractions.length >= thresholds.WARM_MIN_INTERACTIONS) {
        return 'Warm';
    } else {
        return 'Cold';
    }
}

/**
 * Batch update temperatures for multiple leads
 */
export function batchUpdateTemperatures(
    leads: Lead[],
    interactions: Interaction[],
    customThresholds?: Partial<typeof TEMPERATURE_THRESHOLDS>
): Lead[] {
    return leads.map(lead => ({
        ...lead,
        temperature: calculateLeadTemperature(lead, interactions, customThresholds)
    }));
}

/**
 * Get temperature color class for UI
 */
export function getTemperatureColor(temperature: Temperature): {
    text: string;
    bg: string;
    border: string;
} {
    switch (temperature) {
        case 'Hot':
            return {
                text: 'text-red-600',
                bg: 'bg-red-50',
                border: 'border-red-300'
            };
        case 'Warm':
            return {
                text: 'text-orange-600',
                bg: 'bg-orange-50',
                border: 'border-orange-300'
            };
        case 'Cold':
        default:
            return {
                text: 'text-blue-600',
                bg: 'bg-blue-50',
                border: 'border-blue-300'
            };
    }
}

/**
 * Get temperature icon
 */
export function getTemperatureIcon(temperature: Temperature): string {
    switch (temperature) {
        case 'Hot':
            return '🔥';
        case 'Warm':
            return '🌡️';
        case 'Cold':
        default:
            return '❄️';
    }
}

/**
 * Get temperature description for tooltip or help text
 */
export function getTemperatureDescription(temperature: Temperature): string {
    switch (temperature) {
        case 'Hot':
            return 'Recent and frequent interactions - high engagement';
        case 'Warm':
            return 'Some recent activity - moderate engagement';
        case 'Cold':
        default:
            return 'Little to no recent activity - low engagement';
    }
}

/**
 * Analyze temperature trends for a lead
 */
export function analyzeTemperatureTrend(
    lead: Lead,
    interactions: Interaction[],
    periodDays: number = 30
): {
    trend: 'heating' | 'cooling' | 'stable';
    description: string;
    weeklyInteractions: number[];
} {
    const leadInteractions = interactions
        .filter(i => i.leadId === lead.id)
        .filter(i => isWithinDays(i.occurredAt, periodDays))
        .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

    // Calculate weekly interaction counts
    const weeklyInteractions: number[] = [];
    const weeksToAnalyze = Math.ceil(periodDays / 7);

    for (let week = 0; week < weeksToAnalyze; week++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (week + 1) * 7);
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - week * 7);

        const weekCount = leadInteractions.filter(i => {
            const interactionDate = new Date(i.occurredAt);
            return interactionDate >= weekStart && interactionDate < weekEnd;
        }).length;

        weeklyInteractions.unshift(weekCount);
    }

    // Analyze trend
    const recentWeeks = weeklyInteractions.slice(-2);
    const earlierWeeks = weeklyInteractions.slice(0, -2);

    const recentAvg = recentWeeks.reduce((sum, count) => sum + count, 0) / recentWeeks.length;
    const earlierAvg = earlierWeeks.length > 0 ?
        earlierWeeks.reduce((sum, count) => sum + count, 0) / earlierWeeks.length : 0;

    let trend: 'heating' | 'cooling' | 'stable' = 'stable';
    let description = 'Interaction level has remained stable';

    if (recentAvg > earlierAvg * 1.2) {
        trend = 'heating';
        description = 'Interaction frequency is increasing - good momentum!';
    } else if (recentAvg < earlierAvg * 0.8) {
        trend = 'cooling';
        description = 'Interaction frequency is decreasing - may need attention';
    }

    return { trend, description, weeklyInteractions };
}

/**
 * Get recommended actions based on temperature
 */
export function getTemperatureRecommendations(
    temperature: Temperature,
    daysSinceLastInteraction: number
): string[] {
    switch (temperature) {
        case 'Hot':
            return [
                'Keep the momentum going with regular communication',
                'Consider planning an in-person meeting',
                'Share interesting content or experiences',
                'Be responsive to their messages'
            ];
        case 'Warm':
            return [
                'Increase interaction frequency',
                'Send a thoughtful message or question',
                'Share something relevant to their interests',
                'Suggest a casual meetup or call'
            ];
        case 'Cold':
        default:
            if (daysSinceLastInteraction > 14) {
                return [
                    'Re-engage with a light, casual message',
                    'Reference a past conversation or shared interest',
                    'Avoid being pushy - keep it friendly and low-pressure',
                    'Consider if this lead is still worth pursuing'
                ];
            } else {
                return [
                    'Initiate contact soon to maintain connection',
                    'Ask an engaging question about their interests',
                    'Share something valuable or entertaining',
                    'Suggest a low-commitment interaction'
                ];
            }
    }
}

/**
 * Predict when a lead might become cold without action
 */
export function predictColdDate(
    lead: Lead,
    _interactions: Interaction[],
    customThresholds?: Partial<typeof TEMPERATURE_THRESHOLDS>
): Date | null {
    const thresholds = { ...TEMPERATURE_THRESHOLDS, ...customThresholds };

    if (!lead.lastInteractionDate || lead.temperature === 'Cold') {
        return null;
    }

    const lastInteractionDate = new Date(lead.lastInteractionDate);
    const coldDate = new Date(lastInteractionDate);
    coldDate.setDate(coldDate.getDate() + thresholds.COLD_AFTER_DAYS);

    return coldDate > new Date() ? coldDate : null;
}