// Core types for the Game dating CRM application

export type FunnelStage = 'Stage1' | 'Stage2' | 'Stage3' | 'Stage4' | 'Lover' | 'Dead';

export type PlatformOrigin =
    | 'Tinder'
    | 'Bumble'
    | 'Hinge'
    | 'Instagram'
    | 'Facebook'
    | 'WhatsApp'
    | 'Offline'
    | 'Other';

export type Temperature = 'Cold' | 'Warm' | 'Hot';

export type DatingIntention = 'Short Term' | 'Long Term' | 'Long Term Open to Short' | 'Casual' | 'Exploring' | 'Undecided';

export interface Lead {
    id: string;
    name: string;
    profilePhotoUrl?: string; // Base64 encoded image or URL
    photos?: string[]; // Additional photos (base64 or URLs)
    platformOrigin: PlatformOrigin;
    communicationPlatform?: PlatformOrigin[]; // Where we're currently talking (multiple)
    countryOrigin?: string;
    personalityTraits?: string;
    notes?: string;
    qualificationScore?: number; // 1-10 scale
    aestheticsScore?: number; // 1-10 scale
    datingIntention?: DatingIntention;
    funnelStage: FunnelStage;
    originDetails?: string; // Where/how met
    instagramUrl?: string; // Instagram profile link
    isStarred?: boolean; // Pinned to top of lists
    temperature: Temperature;
    lastInteractionDate?: string; // ISO date string
    lastResponseDate?: string; // ISO date string — last INCOMING interaction
    temperatureHistory?: { date: string; temperature: Temperature }[]; // timeline snapshots
    temperatureNotes?: string; // Notes explaining temperature context (e.g. why it got cold)
    temperatureRefDate?: string; // Virtual reference date for manual temp edits — decay continues from here
    stageEnteredAt: string; // ISO date string
    deadFromStage?: FunnelStage; // Which stage lead was in when moved to Dead
    deadNotes?: string; // Notes about why lead went dead
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
}

export interface CreateLeadInput {
    name: string;
    profilePhotoUrl?: string;
    photos?: string[];
    platformOrigin: PlatformOrigin;
    communicationPlatform?: PlatformOrigin[];
    countryOrigin?: string;
    personalityTraits?: string;
    notes?: string;
    qualificationScore?: number;
    aestheticsScore?: number;
    datingIntention?: DatingIntention;
    funnelStage?: FunnelStage;
    originDetails?: string;
    instagramUrl?: string;
}

export interface UpdateLeadInput {
    name?: string;
    profilePhotoUrl?: string;
    photos?: string[];
    platformOrigin?: PlatformOrigin;
    communicationPlatform?: PlatformOrigin[];
    countryOrigin?: string;
    personalityTraits?: string;
    notes?: string;
    qualificationScore?: number;
    aestheticsScore?: number;
    datingIntention?: DatingIntention;
    originDetails?: string;
    instagramUrl?: string;
    isStarred?: boolean;
    temperature?: Temperature;
    lastInteractionDate?: string;
    lastResponseDate?: string;
    temperatureHistory?: { date: string; temperature: Temperature }[];
    temperatureNotes?: string;
    temperatureRefDate?: string;
    deadNotes?: string;
}

// Computed properties for leads
export interface LeadWithComputedProps extends Lead {
    daysSinceLastSpoken: number;
    stageDisplayName: string;
    temperatureColor: string;
    temperatureIcon: string;
    qualificationStars: number;
}

// Lead filtering and sorting options
export interface LeadFilters {
    platforms?: PlatformOrigin[];
    temperatures?: Temperature[];
    stages?: FunnelStage[];
    qualificationRange?: [number, number];
    countries?: string[];
    dateRange?: {
        start: string;
        end: string;
    };
}

export type LeadSortField =
    | 'name'
    | 'qualificationScore'
    | 'lastInteractionDate'
    | 'createdAt'
    | 'stageEnteredAt'
    | 'temperature';

export interface LeadSortOptions {
    field: LeadSortField;
    direction: 'asc' | 'desc';
}