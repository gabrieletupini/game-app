// Common types and interfaces used throughout the application

import type { PlatformOrigin, Temperature } from './Lead';
import type { InteractionType } from './Interaction';

// Generic API response structure
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}

// Pagination
export interface PaginationOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// Analytics and Statistics
export interface FunnelStats {
    stage1: number;
    stage2: number;
    stage3: number;
    stage4: number;
    lovers: number;
    dead: number;
    total: number;
    conversionRate: number; // percentage
}

export interface OriginDistribution {
    platform: PlatformOrigin;
    count: number;
    percentage: number;
}

export interface TemperatureDistribution {
    temperature: Temperature;
    count: number;
    percentage: number;
}

export interface LeadAnalytics {
    totalLeads: number;
    activeLeads: number; // Not in Dead stage
    funnelStats: FunnelStats;
    originDistribution: OriginDistribution[];
    temperatureDistribution: TemperatureDistribution[];
    averageQualificationScore: number;
    averageDaysSinceLastInteraction: number;
    thisMonthNewLeads: number;
    thisMonthInteractions: number;
}

export interface InteractionAnalytics {
    totalInteractions: number;
    thisWeekInteractions: number;
    thisMonthInteractions: number;
    byType: Record<InteractionType, number>;
    averagePerLead: number;
    mostActiveLeads: {
        leadId: string;
        leadName: string;
        interactionCount: number;
    }[];
}

// UI State Types
export interface LoadingState {
    isLoading: boolean;
    message?: string;
}

export interface ErrorState {
    hasError: boolean;
    message?: string;
    code?: string;
}

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number; // milliseconds
    action?: {
        label: string;
        onClick: () => void;
    };
}

// Drag and Drop Types
export interface DragResult {
    draggableId: string;
    type: string;
    source: {
        droppableId: string;
        index: number;
    };
    destination?: {
        droppableId: string;
        index: number;
    } | null;
}

// Modal and Dialog Types
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface ConfirmDialogProps extends ModalProps {
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
}

// Form Types
export interface FormField<T = any> {
    name: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'file' | 'date' | 'checkbox';
    value: T;
    placeholder?: string;
    required?: boolean;
    options?: { label: string; value: any }[];
    validation?: {
        pattern?: RegExp;
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
        custom?: (value: T) => string | null;
    };
}

export interface FormError {
    field: string;
    message: string;
}

// Search and Filter Types
export interface SearchOptions {
    query: string;
    fields: string[];
    caseSensitive?: boolean;
    exactMatch?: boolean;
}

export interface FilterOption<T = any> {
    label: string;
    value: T;
    count?: number;
}

// Theme and Styling
export interface ThemeColors {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    light: string;
    dark: string;
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event Handler Types
export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

// Component Props Types
export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
    testId?: string;
}

// LocalStorage Keys
export const STORAGE_KEYS = {
    LEADS: 'gameApp_leads',
    INTERACTIONS: 'gameApp_interactions',
    SETTINGS: 'gameApp_settings',
    USER_PREFERENCES: 'gameApp_userPreferences',
    LAST_BACKUP: 'gameApp_lastBackup',
} as const;

// Application Constants
export const APP_CONFIG = {
    NAME: 'Game',
    VERSION: '1.0.0',
    DESCRIPTION: 'Dating Lead Organizer for Men',
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    DEFAULT_QUALIFICATION_SCORE: 5,
    MAX_QUALIFICATION_SCORE: 10,
    MIN_QUALIFICATION_SCORE: 1,
} as const;