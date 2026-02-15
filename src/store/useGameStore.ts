// Zustand store for Game application state management

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
    Lead,
    Interaction,
    AppSettings,
    FunnelStage,
    Temperature,
    CreateLeadInput,
    UpdateLeadInput,
    CreateInteractionInput,
    LeadAnalytics,
    FunnelStats,
    OriginDistribution,
    TemperatureDistribution,
    LoadingState,
    ErrorState,
    ToastMessage
} from '../types';
import { localStorageService } from '../services/localStorage';
import { v4 as uuidv4 } from 'uuid';

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
    user: {},
    preferences: {
        theme: 'light',
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h'
    },
    notifications: {
        emailNotifications: false,
        pushNotifications: false,
        reminderNotifications: true,
        coldLeadReminders: true,
        coldLeadThreshold: 7,
        dailyDigest: false,
        weeklyReport: false
    },
    privacy: {
        dataRetentionPeriod: 0,
        autoBackup: true,
        encryptLocalData: false,
        shareAnalytics: false
    },
    funnel: {
        stageNames: {
            Stage1: 'Initial Contact',
            Stage2: 'Qualified Interest',
            Stage3: 'Real-World Interaction',
            Stage4: 'Intimacy & Connection'
        },
        autoPromotionRules: {
            enabled: false,
            stage3ToStage4Days: 14,
            stage4ToLoverDays: 30
        },
        temperatureThresholds: {
            coldAfterDays: 7,
            warmMinInteractions: 1,
            hotMinInteractions: 3
        }
    },
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

interface GameStore {
    // State
    leads: Lead[];
    interactions: Interaction[];
    settings: AppSettings;
    loading: LoadingState;
    error: ErrorState;
    toasts: ToastMessage[];

    // Lead Actions
    loadData: () => void;
    addLead: (input: CreateLeadInput) => void;
    updateLead: (id: string, updates: UpdateLeadInput) => void;
    deleteLead: (id: string) => void;
    moveLeadToStage: (id: string, stage: FunnelStage) => void;

    // Interaction Actions
    addInteraction: (input: CreateInteractionInput) => void;
    updateInteraction: (id: string, updates: Partial<Interaction>) => void;
    deleteInteraction: (id: string) => void;

    // Settings Actions
    updateSettings: (updates: Partial<AppSettings>) => void;
    resetSettings: () => void;

    // UI Actions
    setLoading: (loading: LoadingState) => void;
    setError: (error: ErrorState) => void;
    addToast: (toast: Omit<ToastMessage, 'id'>) => void;
    removeToast: (id: string) => void;
    clearToasts: () => void;

    // Computed Values
    getLeadsByStage: (stage: FunnelStage) => Lead[];
    getLeadById: (id: string) => Lead | undefined;
    getInteractionsByLeadId: (leadId: string) => Interaction[];
    getLeadAnalytics: () => LeadAnalytics;
    getFunnelStats: () => FunnelStats;
    getOriginDistribution: () => OriginDistribution[];
    getTemperatureDistribution: () => TemperatureDistribution[];

    // Utility Actions
    exportData: () => string;
    importData: (jsonData: string) => Promise<void>;
    clearAllData: () => void;
    calculateLeadTemperature: (leadId: string) => Temperature;
}

export const useGameStore = create<GameStore>()(
    subscribeWithSelector((set, get) => ({
        // Initial State
        leads: [],
        interactions: [],
        settings: DEFAULT_SETTINGS,
        loading: { isLoading: false },
        error: { hasError: false },
        toasts: [],

        // Load data from localStorage
        loadData: () => {
            try {
                set({ loading: { isLoading: true, message: 'Loading data...' } });

                const leads = localStorageService.getLeads();
                const interactions = localStorageService.getInteractions();
                const settings = localStorageService.getSettings() || DEFAULT_SETTINGS;

                set({
                    leads,
                    interactions,
                    settings,
                    loading: { isLoading: false },
                    error: { hasError: false }
                });
            } catch (error) {
                set({
                    loading: { isLoading: false },
                    error: {
                        hasError: true,
                        message: `Failed to load data: ${(error as Error).message}`
                    }
                });
            }
        },

        // Lead Actions
        addLead: (input: CreateLeadInput) => {
            try {
                const now = new Date().toISOString();
                const newLead: Lead = {
                    id: uuidv4(),
                    name: input.name,
                    profilePhotoUrl: input.profilePhotoUrl,
                    platformOrigin: input.platformOrigin,
                    countryOrigin: input.countryOrigin,
                    personalityTraits: input.personalityTraits,
                    notes: input.notes,
                    qualificationScore: input.qualificationScore || 5,
                    aestheticsScore: input.aestheticsScore || 5,
                    datingIntention: input.datingIntention || 'Undecided',
                    funnelStage: input.funnelStage || 'Stage1',
                    originDetails: input.originDetails,
                    temperature: 'Cold',
                    stageEnteredAt: now,
                    createdAt: now,
                    updatedAt: now
                };

                localStorageService.addLead(newLead);

                set(state => ({
                    leads: [...state.leads, newLead]
                }));

                get().addToast({
                    type: 'success',
                    title: 'Lead Added',
                    message: `${newLead.name} has been added to your funnel`,
                    duration: 3000
                });
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to add lead: ${(error as Error).message}`
                });
            }
        },

        updateLead: (id: string, updates: UpdateLeadInput) => {
            try {
                const updatedData = {
                    ...updates,
                    updatedAt: new Date().toISOString()
                };

                localStorageService.updateLead(id, updatedData);

                set(state => ({
                    leads: state.leads.map(lead =>
                        lead.id === id ? { ...lead, ...updatedData } : lead
                    )
                }));
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to update lead: ${(error as Error).message}`
                });
            }
        },

        deleteLead: (id: string) => {
            try {
                localStorageService.deleteLead(id);

                set(state => ({
                    leads: state.leads.filter(lead => lead.id !== id),
                    interactions: state.interactions.filter(interaction => interaction.leadId !== id)
                }));

                get().addToast({
                    type: 'success',
                    title: 'Lead Deleted',
                    message: 'Lead and associated interactions have been removed',
                    duration: 3000
                });
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to delete lead: ${(error as Error).message}`
                });
            }
        },

        moveLeadToStage: (id: string, stage: FunnelStage) => {
            try {
                const updates = {
                    funnelStage: stage,
                    stageEnteredAt: new Date().toISOString()
                };

                localStorageService.updateLead(id, updates);

                set(state => ({
                    leads: state.leads.map(lead =>
                        lead.id === id ? { ...lead, ...updates } : lead
                    )
                }));
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to move lead: ${(error as Error).message}`
                });
            }
        },

        // Interaction Actions
        addInteraction: (input: CreateInteractionInput) => {
            try {
                const newInteraction: Interaction = {
                    id: uuidv4(),
                    leadId: input.leadId,
                    type: input.type,
                    direction: input.direction,
                    notes: input.notes,
                    occurredAt: input.occurredAt,
                    createdAt: new Date().toISOString()
                };

                localStorageService.addInteraction(newInteraction);

                set(state => ({
                    interactions: [...state.interactions, newInteraction]
                }));

                // Update lead's last interaction date and recalculate temperature
                get().updateLead(input.leadId, {
                    lastInteractionDate: input.occurredAt,
                    temperature: get().calculateLeadTemperature(input.leadId)
                });
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to add interaction: ${(error as Error).message}`
                });
            }
        },

        updateInteraction: (id: string, updates: Partial<Interaction>) => {
            try {
                localStorageService.updateInteraction(id, updates);

                set(state => ({
                    interactions: state.interactions.map(interaction =>
                        interaction.id === id ? { ...interaction, ...updates } : interaction
                    )
                }));
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to update interaction: ${(error as Error).message}`
                });
            }
        },

        deleteInteraction: (id: string) => {
            try {
                localStorageService.deleteInteraction(id);

                set(state => ({
                    interactions: state.interactions.filter(interaction => interaction.id !== id)
                }));
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to delete interaction: ${(error as Error).message}`
                });
            }
        },

        // Settings Actions
        updateSettings: (updates: Partial<AppSettings>) => {
            try {
                const updatedSettings = {
                    ...get().settings,
                    ...updates,
                    updatedAt: new Date().toISOString()
                };

                localStorageService.saveSettings(updatedSettings);

                set({ settings: updatedSettings });
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to update settings: ${(error as Error).message}`
                });
            }
        },

        resetSettings: () => {
            try {
                const resetSettings = {
                    ...DEFAULT_SETTINGS,
                    user: get().settings.user, // Keep user info
                    createdAt: get().settings.createdAt, // Keep original creation date
                    updatedAt: new Date().toISOString()
                };

                localStorageService.saveSettings(resetSettings);
                set({ settings: resetSettings });
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to reset settings: ${(error as Error).message}`
                });
            }
        },

        // UI Actions
        setLoading: (loading: LoadingState) => set({ loading }),

        setError: (error: ErrorState) => set({ error }),

        addToast: (toast: Omit<ToastMessage, 'id'>) => {
            const newToast: ToastMessage = {
                ...toast,
                id: uuidv4()
            };

            set(state => ({
                toasts: [...state.toasts, newToast]
            }));

            // Auto-remove toast after duration
            if (toast.duration) {
                setTimeout(() => {
                    get().removeToast(newToast.id);
                }, toast.duration);
            }
        },

        removeToast: (id: string) => {
            set(state => ({
                toasts: state.toasts.filter(toast => toast.id !== id)
            }));
        },

        clearToasts: () => set({ toasts: [] }),

        // Computed Values
        getLeadsByStage: (stage: FunnelStage) => {
            return get().leads.filter(lead => lead.funnelStage === stage);
        },

        getLeadById: (id: string) => {
            return get().leads.find(lead => lead.id === id);
        },

        getInteractionsByLeadId: (leadId: string) => {
            return get().interactions.filter(interaction => interaction.leadId === leadId);
        },

        getFunnelStats: () => {
            const leads = get().leads;
            const activeLeads = leads.filter(lead => lead.funnelStage !== 'Dead');

            const stats: FunnelStats = {
                stage1: leads.filter(l => l.funnelStage === 'Stage1').length,
                stage2: leads.filter(l => l.funnelStage === 'Stage2').length,
                stage3: leads.filter(l => l.funnelStage === 'Stage3').length,
                stage4: leads.filter(l => l.funnelStage === 'Stage4').length,
                lovers: leads.filter(l => l.funnelStage === 'Lover').length,
                dead: leads.filter(l => l.funnelStage === 'Dead').length,
                total: leads.length,
                conversionRate: activeLeads.length > 0 ?
                    (leads.filter(l => l.funnelStage === 'Lover').length / activeLeads.length) * 100 : 0
            };

            return stats;
        },

        getOriginDistribution: () => {
            const leads = get().leads.filter(lead => lead.funnelStage !== 'Dead');
            const total = leads.length;

            if (total === 0) return [];

            const distribution = leads.reduce((acc, lead) => {
                const platform = lead.platformOrigin;
                acc[platform] = (acc[platform] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return Object.entries(distribution).map(([platform, count]) => ({
                platform: platform as any,
                count,
                percentage: (count / total) * 100
            }));
        },

        getTemperatureDistribution: () => {
            const leads = get().leads.filter(lead => lead.funnelStage !== 'Dead');
            const total = leads.length;

            if (total === 0) return [];

            const distribution = leads.reduce((acc, lead) => {
                const temp = lead.temperature;
                acc[temp] = (acc[temp] || 0) + 1;
                return acc;
            }, {} as Record<Temperature, number>);

            return Object.entries(distribution).map(([temperature, count]) => ({
                temperature: temperature as Temperature,
                count,
                percentage: (count / total) * 100
            }));
        },

        getLeadAnalytics: () => {
            const leads = get().leads;
            const interactions = get().interactions;
            const activeLeads = leads.filter(lead => lead.funnelStage !== 'Dead');

            const now = new Date();
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const analytics: LeadAnalytics = {
                totalLeads: leads.length,
                activeLeads: activeLeads.length,
                funnelStats: get().getFunnelStats(),
                originDistribution: get().getOriginDistribution(),
                temperatureDistribution: get().getTemperatureDistribution(),
                averageQualificationScore: activeLeads.length > 0 ?
                    activeLeads.reduce((sum, lead) => {
                        const qual = lead.qualificationScore || 5;
                        const aes = lead.aestheticsScore || 5;
                        return sum + (qual + aes) / 2;
                    }, 0) / activeLeads.length : 0,
                averageDaysSinceLastInteraction: 0, // Calculate this
                thisMonthNewLeads: leads.filter(lead => new Date(lead.createdAt) >= thisMonth).length,
                thisMonthInteractions: interactions.filter(interaction => new Date(interaction.occurredAt) >= thisMonth).length
            };

            return analytics;
        },

        // Utility Actions
        exportData: () => {
            try {
                const exportData = localStorageService.exportAllData();
                return JSON.stringify(exportData, null, 2);
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to export data: ${(error as Error).message}`
                });
                return '';
            }
        },

        importData: async (jsonData: string) => {
            try {
                get().setLoading({ isLoading: true, message: 'Importing data...' });

                const data = JSON.parse(jsonData);
                const result = localStorageService.importAllData(data);

                if (result.success) {
                    // Reload data from storage
                    get().loadData();

                    get().addToast({
                        type: 'success',
                        title: 'Import Successful',
                        message: `Imported ${result.stats?.leadsImported} leads and ${result.stats?.interactionsImported} interactions`,
                        duration: 5000
                    });
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to import data: ${(error as Error).message}`
                });
            } finally {
                get().setLoading({ isLoading: false });
            }
        },

        clearAllData: () => {
            try {
                localStorageService.clearAllData();
                set({
                    leads: [],
                    interactions: [],
                    settings: DEFAULT_SETTINGS
                });

                get().addToast({
                    type: 'success',
                    title: 'Data Cleared',
                    message: 'All data has been cleared successfully',
                    duration: 3000
                });
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to clear data: ${(error as Error).message}`
                });
            }
        },

        // Helper function for temperature calculation
        calculateLeadTemperature: (leadId: string): Temperature => {
            const lead = get().getLeadById(leadId);
            const interactions = get().getInteractionsByLeadId(leadId);

            if (!lead || !lead.lastInteractionDate) return 'Cold';

            const now = new Date();
            const lastInteraction = new Date(lead.lastInteractionDate);
            const daysSince = Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));

            const recentInteractions = interactions.filter(interaction => {
                const interactionDate = new Date(interaction.occurredAt);
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return interactionDate >= weekAgo;
            }).length;

            const thresholds = get().settings.funnel.temperatureThresholds;

            if (daysSince <= 2 && recentInteractions >= thresholds.hotMinInteractions) {
                return 'Hot';
            } else if (daysSince <= thresholds.coldAfterDays && recentInteractions >= thresholds.warmMinInteractions) {
                return 'Warm';
            } else {
                return 'Cold';
            }
        }
    }))
);

// Helper hook for loading state
export const useLoading = () => useGameStore(state => state.loading);

// Helper hook for error state  
export const useError = () => useGameStore(state => state.error);

// Helper hook for toasts
export const useToasts = () => useGameStore(state => state.toasts);