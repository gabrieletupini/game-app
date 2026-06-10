// Garden / watering helpers
//
// The app's purpose is building connections by talking to them regularly.
// Each connection is a "plant" you irrigate 1-3 times a week. A "watering" is
// simply a logged Interaction — any contact in a week nurtures that connection.
// Plant health is derived from the number of waterings in the current ISO week.

import { parseISO, isValid } from 'date-fns';
import type { Interaction } from '../types';

// Weekly nurture goal: talk to each connection 1-3 times a week.
export const WEEKLY_MIN = 1;
export const WEEKLY_GOAL = 3;

export type PlantStage = 'wilting' | 'growing' | 'thriving';

export interface PlantHealth {
    stage: PlantStage;
    emoji: string;
    label: string;
    textClass: string;
    bgClass: string;
    accentClass: string;
}

const HEALTH: Record<PlantStage, PlantHealth> = {
    wilting: {
        stage: 'wilting',
        emoji: '🥀',
        label: 'Needs water',
        textClass: 'text-rose-600',
        bgClass: 'bg-rose-50',
        accentClass: 'bg-rose-400',
    },
    growing: {
        stage: 'growing',
        emoji: '🌱',
        label: 'Growing',
        textClass: 'text-amber-600',
        bgClass: 'bg-amber-50',
        accentClass: 'bg-amber-400',
    },
    thriving: {
        stage: 'thriving',
        emoji: '🌿',
        label: 'Thriving',
        textClass: 'text-emerald-600',
        bgClass: 'bg-emerald-50',
        accentClass: 'bg-emerald-400',
    },
};

/** Monday-based start of the ISO week containing `date` (local time, 00:00). */
export function startOfISOWeek(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    // getDay(): 0=Sun..6=Sat. Shift so Monday is the first day.
    const dayFromMonday = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dayFromMonday);
    return d;
}

/** ISO week key like "2026-W24" — stable identifier for a given week. */
export function isoWeekKey(date: Date = new Date()): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum =
        1 +
        Math.round(
            ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
        );
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function toDate(value: string | Date): Date | null {
    const d = typeof value === 'string' ? parseISO(value) : value;
    return isValid(d) ? d : null;
}

/** How many times this connection was watered (talked to) in the given ISO week. */
export function getWaterCountThisWeek(
    interactions: Interaction[],
    leadId: string,
    refDate: Date = new Date()
): number {
    const start = startOfISOWeek(refDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7); // exclusive end (next Monday 00:00)

    return interactions.reduce((count, i) => {
        if (i.leadId !== leadId) return count;
        const d = toDate(i.occurredAt);
        if (!d) return count;
        return d >= start && d < end ? count + 1 : count;
    }, 0);
}

/** Plant health for a given number of waterings this week. */
export function getPlantHealth(waterCount: number): PlantHealth {
    if (waterCount >= WEEKLY_GOAL) return HEALTH.thriving;
    if (waterCount >= WEEKLY_MIN) return HEALTH.growing;
    return HEALTH.wilting;
}
