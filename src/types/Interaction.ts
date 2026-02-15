// Interaction types for tracking communications with leads

export type InteractionType =
    | 'Message'
    | 'Call'
    | 'Date'
    | 'Meeting'
    | 'Other';

export type InteractionDirection = 'Incoming' | 'Outgoing';

export interface Interaction {
    id: string;
    leadId: string;
    type: InteractionType;
    direction: InteractionDirection;
    notes?: string;
    occurredAt: string; // ISO date string
    createdAt: string; // ISO date string
}

export interface CreateInteractionInput {
    leadId: string;
    type: InteractionType;
    direction: InteractionDirection;
    notes?: string;
    occurredAt: string;
}

export interface UpdateInteractionInput {
    type?: InteractionType;
    direction?: InteractionDirection;
    notes?: string;
    occurredAt?: string;
}

// Interaction with display properties
export interface InteractionWithDisplayProps extends Interaction {
    typeIcon: string;
    directionIcon: string;
    timeAgo: string;
    displayDate: string;
}

// Interaction statistics
export interface InteractionStats {
    total: number;
    byType: Record<InteractionType, number>;
    byDirection: Record<InteractionDirection, number>;
    thisWeek: number;
    thisMonth: number;
    averagePerWeek: number;
}

// Interaction filters
export interface InteractionFilters {
    types?: InteractionType[];
    directions?: InteractionDirection[];
    dateRange?: {
        start: string;
        end: string;
    };
}

export type InteractionSortField =
    | 'occurredAt'
    | 'createdAt'
    | 'type';

export interface InteractionSortOptions {
    field: InteractionSortField;
    direction: 'asc' | 'desc';
}