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
import { firestoreService } from '../services/firestoreService';
import { v4 as uuidv4 } from 'uuid';

// Migrate old data: convert communicationPlatform from string to array
function normalizeLead(lead: Lead): Lead {
    const cp = lead.communicationPlatform as unknown;
    if (typeof cp === 'string') {
        return { ...lead, communicationPlatform: cp ? [cp as Lead['platformOrigin']] : [lead.platformOrigin] };
    }
    if (!Array.isArray(cp) || cp.length === 0) {
        return { ...lead, communicationPlatform: [lead.platformOrigin] };
    }
    return lead;
}
function normalizeLeads(leads: Lead[]): Lead[] {
    return leads.map(normalizeLead);
}

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
    recalculateAllTemperatures: () => void;
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

        // Load data from Firestore (falls back to localStorage if offline)
        loadData: () => {
            set({ loading: { isLoading: true, message: 'Loading data...' } });

            // Load from localStorage immediately for fast startup
            const cachedLeads = localStorageService.getLeads();
            const cachedInteractions = localStorageService.getInteractions();
            const cachedSettings = localStorageService.getSettings() || DEFAULT_SETTINGS;

            set({
                leads: normalizeLeads(cachedLeads),
                interactions: cachedInteractions,
                settings: cachedSettings,
                loading: { isLoading: false },
                error: { hasError: false }
            });

            // Recalculate temperatures on load (time-based decay)
            setTimeout(() => get().recalculateAllTemperatures(), 100);

            // Then hydrate from Firestore (async)
            firestoreService.loadAll().then(data => {
                set({
                    leads: normalizeLeads(data.leads || []),
                    interactions: data.interactions || [],
                    settings: data.settings || DEFAULT_SETTINGS,
                });
                // Recalculate after Firestore hydration too
                setTimeout(() => get().recalculateAllTemperatures(), 100);
            }).catch(err => {
                console.warn('Firestore hydration failed, using localStorage cache:', err);
            });

            // Subscribe to real-time updates from other devices/tabs
            firestoreService.subscribeToChanges((data) => {
                set({
                    leads: normalizeLeads(data.leads || []),
                    interactions: data.interactions || [],
                    settings: data.settings || get().settings,
                });
            });
        },

        // Recalculate temperatures for all active leads and snapshot history
        recalculateAllTemperatures: () => {
            const leads = get().leads;
            const now = new Date().toISOString();
            let changed = false;

            const updatedLeads = leads.map(lead => {
                if (lead.funnelStage === 'Dead' || lead.funnelStage === 'Lover') return lead;

                const newTemp = get().calculateLeadTemperature(lead.id);
                if (newTemp === lead.temperature) return lead;

                changed = true;
                const history = [...(lead.temperatureHistory || [])];
                // Only record if the temperature actually changed
                if (history.length === 0 || history[history.length - 1].temperature !== newTemp) {
                    history.push({ date: now, temperature: newTemp });
                }
                return { ...lead, temperature: newTemp, temperatureHistory: history, updatedAt: now };
            });

            if (changed) {
                set({ leads: updatedLeads });
                firestoreService.saveLeads(updatedLeads);
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
                    communicationPlatform: input.communicationPlatform?.length ? input.communicationPlatform : [input.platformOrigin],
                    countryOrigin: input.countryOrigin,
                    personalityTraits: input.personalityTraits,
                    notes: input.notes,
                    qualificationScore: input.qualificationScore || 5,
                    aestheticsScore: input.aestheticsScore || 5,
                    datingIntention: input.datingIntention || 'Undecided',
                    funnelStage: input.funnelStage || 'Stage1',
                    originDetails: input.originDetails,
                    temperature: 'Hot',
                    temperatureHistory: [{ date: now, temperature: 'Hot' as Temperature }],
                    stageEnteredAt: now,
                    createdAt: now,
                    updatedAt: now
                };

                const updatedLeads = [...get().leads, newLead];
                set({ leads: updatedLeads });
                firestoreService.saveLeads(updatedLeads);

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
                // Strip undefined values so they don't overwrite existing data
                const cleanUpdates: Record<string, unknown> = {};
                for (const [key, value] of Object.entries(updates)) {
                    if (value !== undefined) cleanUpdates[key] = value;
                }
                const updatedData = {
                    ...cleanUpdates,
                    updatedAt: new Date().toISOString()
                };

                const updatedLeads = get().leads.map(lead =>
                    lead.id === id ? { ...lead, ...updatedData } : lead
                );
                set({ leads: updatedLeads });
                firestoreService.saveLeads(updatedLeads);
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to update lead: ${(error as Error).message}`
                });
            }
        },

        deleteLead: (id: string) => {
            try {
                const updatedLeads = get().leads.filter(lead => lead.id !== id);
                const updatedInteractions = get().interactions.filter(interaction => interaction.leadId !== id);
                set({ leads: updatedLeads, interactions: updatedInteractions });
                firestoreService.saveLeads(updatedLeads);
                firestoreService.saveInteractions(updatedInteractions);

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
                const currentLead = get().leads.find(l => l.id === id);
                const updates: Partial<Lead> = {
                    funnelStage: stage,
                    stageEnteredAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                // Record which stage the lead died from
                if (stage === 'Dead' && currentLead) {
                    updates.deadFromStage = currentLead.funnelStage;
                }

                // Clear dead tracking when reviving
                if (stage !== 'Dead') {
                    updates.deadFromStage = undefined;
                    updates.deadNotes = undefined;
                }

                const updatedLeads = get().leads.map(lead =>
                    lead.id === id ? { ...lead, ...updates } : lead
                );
                set({ leads: updatedLeads });
                firestoreService.saveLeads(updatedLeads);
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

                const updatedInteractions = [...get().interactions, newInteraction];
                set({ interactions: updatedInteractions });
                firestoreService.saveInteractions(updatedInteractions);

                // Build update payload
                const leadUpdate: UpdateLeadInput = {
                    lastInteractionDate: input.occurredAt,
                };

                // If incoming response → reset to Hot + record response date
                if (input.direction === 'Incoming') {
                    leadUpdate.lastResponseDate = input.occurredAt;
                    leadUpdate.temperature = 'Hot';
                    const lead = get().getLeadById(input.leadId);
                    if (lead) {
                        const history = [...(lead.temperatureHistory || [])];
                        if (history.length === 0 || history[history.length - 1].temperature !== 'Hot') {
                            history.push({ date: new Date().toISOString(), temperature: 'Hot' });
                        }
                        leadUpdate.temperatureHistory = history;
                    }
                } else {
                    // Outgoing — just recalculate based on current state
                    leadUpdate.temperature = get().calculateLeadTemperature(input.leadId);
                }

                get().updateLead(input.leadId, leadUpdate);
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to add interaction: ${(error as Error).message}`
                });
            }
        },

        updateInteraction: (id: string, updates: Partial<Interaction>) => {
            try {
                const updatedInteractions = get().interactions.map(interaction =>
                    interaction.id === id ? { ...interaction, ...updates } : interaction
                );
                set({ interactions: updatedInteractions });
                firestoreService.saveInteractions(updatedInteractions);
            } catch (error) {
                get().setError({
                    hasError: true,
                    message: `Failed to update interaction: ${(error as Error).message}`
                });
            }
        },

        deleteInteraction: (id: string) => {
            try {
                const updatedInteractions = get().interactions.filter(interaction => interaction.id !== id);
                set({ interactions: updatedInteractions });
                firestoreService.saveInteractions(updatedInteractions);
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

                set({ settings: updatedSettings });
                firestoreService.saveSettings(updatedSettings);
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
                    user: get().settings.user,
                    createdAt: get().settings.createdAt,
                    updatedAt: new Date().toISOString()
                };

                set({ settings: resetSettings });
                firestoreService.saveSettings(resetSettings);
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
                set({
                    leads: [],
                    interactions: [],
                    settings: DEFAULT_SETTINGS
                });
                firestoreService.clearAll();

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

        // Helper function for temperature calculation — response-based decay
        // Hot → Warm after 3 days with no incoming response
        // Warm → Cold after 7 days with no incoming response
        // Incoming interaction resets to Hot
        calculateLeadTemperature: (leadId: string): Temperature => {
            const lead = get().getLeadById(leadId);
            if (!lead) return 'Cold';

            // Use lastResponseDate (incoming) if available, otherwise lastInteractionDate, otherwise createdAt
            const referenceDate = lead.lastResponseDate || lead.lastInteractionDate || lead.createdAt;
            const now = new Date();
            const refDate = new Date(referenceDate);
            const daysSince = Math.floor((now.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysSince <= 3) {
                return 'Hot';
            } else if (daysSince <= 7) {
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