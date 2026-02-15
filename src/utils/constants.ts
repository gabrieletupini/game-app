// Application constants and configuration

// Storage keys for localStorage
export const STORAGE_KEYS = {
    LEADS: 'gameApp_leads',
    INTERACTIONS: 'gameApp_interactions',
    SETTINGS: 'gameApp_settings',
    USER_PREFERENCES: 'gameApp_userPreferences',
    LAST_BACKUP: 'gameApp_lastBackup',
} as const;

// Application configuration
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

// UI Constants
export const FUNNEL_STAGE_NAMES = {
    Stage1: 'Initial Contact',
    Stage2: 'Qualified Interest',
    Stage3: 'Real-World Interaction',
    Stage4: 'Intimacy & Connection',
    Lover: 'Lovers',
    Dead: 'Dead Leads'
} as const;

export const PLATFORM_ICONS = {
    Tinder: '🔥',
    Bumble: '💛',
    Instagram: '📸',
    Facebook: '👥',
    WhatsApp: '💬',
    Offline: '🌍',
    Other: '📱'
} as const;

export const TEMPERATURE_CONFIG = {
    Hot: {
        icon: '🔥',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500'
    },
    Warm: {
        icon: '🌡️',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-500'
    },
    Cold: {
        icon: '❄️',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-500'
    }
} as const;

export const INTENTION_CONFIG = {
    'Short Term': { emoji: '⚡', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    'Long Term': { emoji: '💍', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    'Long Term Open to Short': { emoji: '💞', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
    'Casual': { emoji: '🎉', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    'Exploring': { emoji: '🧭', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    'Undecided': { emoji: '🤷', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
} as const;

export const INTERACTION_TYPE_ICONS = {
    Message: '💬',
    Call: '📞',
    Date: '☕',
    Meeting: '👥',
    Other: '📝'
} as const;

export const INTERACTION_DIRECTION_ICONS = {
    Incoming: '📥',
    Outgoing: '📤'
} as const;

// Default thresholds for temperature calculation
export const TEMPERATURE_THRESHOLDS = {
    COLD_AFTER_DAYS: 7,
    WARM_MIN_INTERACTIONS: 1,
    HOT_MIN_INTERACTIONS: 3,
    HOT_MAX_DAYS_SINCE_LAST: 2,
    RECENT_INTERACTION_WINDOW_DAYS: 7
} as const;

// Qualification score display
export const QUALIFICATION_DISPLAY = {
    1: { stars: '⭐', color: 'text-red-500', label: 'Low' },
    2: { stars: '⭐', color: 'text-red-500', label: 'Low' },
    3: { stars: '⭐', color: 'text-red-500', label: 'Low' },
    4: { stars: '⭐⭐', color: 'text-orange-500', label: 'Medium' },
    5: { stars: '⭐⭐', color: 'text-orange-500', label: 'Medium' },
    6: { stars: '⭐⭐', color: 'text-orange-500', label: 'Medium' },
    7: { stars: '⭐⭐⭐', color: 'text-yellow-500', label: 'High' },
    8: { stars: '⭐⭐⭐', color: 'text-yellow-500', label: 'High' },
    9: { stars: '🌟', color: 'text-amber-500', label: 'Excellent' },
    10: { stars: '🌟', color: 'text-amber-500', label: 'Excellent' }
} as const;

// Funnel stage colors for UI
export const FUNNEL_STAGE_COLORS = {
    Stage1: {
        bg: 'bg-blue-100',
        border: 'border-blue-300',
        text: 'text-blue-800',
        accent: 'bg-blue-500'
    },
    Stage2: {
        bg: 'bg-green-100',
        border: 'border-green-300',
        text: 'text-green-800',
        accent: 'bg-green-500'
    },
    Stage3: {
        bg: 'bg-orange-100',
        border: 'border-orange-300',
        text: 'text-orange-800',
        accent: 'bg-orange-500'
    },
    Stage4: {
        bg: 'bg-purple-100',
        border: 'border-purple-300',
        text: 'text-purple-800',
        accent: 'bg-purple-500'
    },
    Lover: {
        bg: 'bg-yellow-100',
        border: 'border-yellow-300',
        text: 'text-yellow-800',
        accent: 'bg-yellow-500'
    },
    Dead: {
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-800',
        accent: 'bg-gray-500'
    }
} as const;

// Animation durations
export const ANIMATION_DURATIONS = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536
} as const;