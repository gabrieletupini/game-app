// Application settings and configuration types

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: 'en' | 'es' | 'fr' | 'de' | 'it';
    timezone: string;
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
}

export interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    reminderNotifications: boolean;
    coldLeadReminders: boolean;
    coldLeadThreshold: number; // days
    dailyDigest: boolean;
    weeklyReport: boolean;
}

export interface PrivacySettings {
    dataRetentionPeriod: number; // months, 0 = forever
    autoBackup: boolean;
    encryptLocalData: boolean;
    shareAnalytics: boolean;
}

export interface FunnelSettings {
    stageNames: {
        Stage1: string;
        Stage2: string;
        Stage3: string;
        Stage4: string;
    };
    autoPromotionRules: {
        enabled: boolean;
        stage3ToStage4Days: number;
        stage4ToLoverDays: number;
    };
    temperatureThresholds: {
        coldAfterDays: number;
        warmMinInteractions: number;
        hotMinInteractions: number;
    };
}

export interface AppSettings {
    user: {
        name?: string;
        email?: string;
        avatar?: string;
    };
    preferences: UserPreferences;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    funnel: FunnelSettings;
    version: string;
    lastBackup?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DefaultSettings {
    preferences: UserPreferences;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    funnel: FunnelSettings;
}

// Export/Import data structure
export interface ExportData {
    leads: any[]; // Will be Lead[] when imported
    interactions: any[]; // Will be Interaction[] when imported
    settings: AppSettings;
    exportedAt: string;
    version: string;
    checksum?: string;
}

export interface ImportResult {
    success: boolean;
    message: string;
    stats?: {
        leadsImported: number;
        interactionsImported: number;
        settingsUpdated: boolean;
    };
    errors?: string[];
}