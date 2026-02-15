// LocalStorage service for persisting application data

import { Lead, Interaction, AppSettings, ExportData, ImportResult, STORAGE_KEYS } from '../types';

// Error classes
export class StorageError extends Error {
    constructor(message: string, public cause?: Error) {
        super(message);
        this.name = 'StorageError';
    }
}

export class QuotaExceededError extends StorageError {
    constructor() {
        super('Storage quota exceeded. Please free up space or export your data.');
        this.name = 'QuotaExceededError';
    }
}

class LocalStorageService {
    private static instance: LocalStorageService;

    static getInstance(): LocalStorageService {
        if (!this.instance) {
            this.instance = new LocalStorageService();
        }
        return this.instance;
    }

    private constructor() {
        this.checkStorageAvailability();
    }

    // Check if localStorage is available
    private checkStorageAvailability(): void {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
        } catch (error) {
            throw new StorageError('LocalStorage is not available', error as Error);
        }
    }

    // Generic storage methods
    private setItem<T>(key: string, value: T): void {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                throw new QuotaExceededError();
            }
            throw new StorageError(`Failed to save ${key}`, error as Error);
        }
    }

    private getItem<T>(key: string, defaultValue: T): T {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item) as T;
        } catch (error) {
            console.warn(`Failed to parse ${key} from localStorage, returning default value`, error);
            return defaultValue;
        }
    }

    private removeItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            throw new StorageError(`Failed to remove ${key}`, error as Error);
        }
    }

    // Lead management methods
    saveLeads(leads: Lead[]): void {
        this.setItem(STORAGE_KEYS.LEADS, leads);
    }

    getLeads(): Lead[] {
        return this.getItem<Lead[]>(STORAGE_KEYS.LEADS, []);
    }

    addLead(lead: Lead): void {
        const leads = this.getLeads();
        leads.push(lead);
        this.saveLeads(leads);
    }

    updateLead(leadId: string, updates: Partial<Lead>): void {
        const leads = this.getLeads();
        const index = leads.findIndex(lead => lead.id === leadId);

        if (index === -1) {
            throw new StorageError(`Lead with ID ${leadId} not found`);
        }

        leads[index] = {
            ...leads[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveLeads(leads);
    }

    deleteLead(leadId: string): void {
        const leads = this.getLeads();
        const filteredLeads = leads.filter(lead => lead.id !== leadId);

        if (filteredLeads.length === leads.length) {
            throw new StorageError(`Lead with ID ${leadId} not found`);
        }

        this.saveLeads(filteredLeads);

        // Also remove associated interactions
        const interactions = this.getInteractions();
        const filteredInteractions = interactions.filter(interaction => interaction.leadId !== leadId);
        this.saveInteractions(filteredInteractions);
    }

    // Interaction management methods
    saveInteractions(interactions: Interaction[]): void {
        this.setItem(STORAGE_KEYS.INTERACTIONS, interactions);
    }

    getInteractions(): Interaction[] {
        return this.getItem<Interaction[]>(STORAGE_KEYS.INTERACTIONS, []);
    }

    addInteraction(interaction: Interaction): void {
        const interactions = this.getInteractions();
        interactions.push(interaction);
        this.saveInteractions(interactions);

        // Update the lead's last interaction date
        this.updateLead(interaction.leadId, {
            lastInteractionDate: interaction.occurredAt
        });
    }

    updateInteraction(interactionId: string, updates: Partial<Interaction>): void {
        const interactions = this.getInteractions();
        const index = interactions.findIndex(interaction => interaction.id === interactionId);

        if (index === -1) {
            throw new StorageError(`Interaction with ID ${interactionId} not found`);
        }

        interactions[index] = { ...interactions[index], ...updates };
        this.saveInteractions(interactions);
    }

    deleteInteraction(interactionId: string): void {
        const interactions = this.getInteractions();
        const filteredInteractions = interactions.filter(interaction => interaction.id !== interactionId);

        if (filteredInteractions.length === interactions.length) {
            throw new StorageError(`Interaction with ID ${interactionId} not found`);
        }

        this.saveInteractions(filteredInteractions);
    }

    getInteractionsByLeadId(leadId: string): Interaction[] {
        const interactions = this.getInteractions();
        return interactions.filter(interaction => interaction.leadId === leadId);
    }

    // Settings management methods
    saveSettings(settings: AppSettings): void {
        this.setItem(STORAGE_KEYS.SETTINGS, settings);
    }

    getSettings(): AppSettings | null {
        try {
            const item = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (item === null) {
                return null;
            }
            return JSON.parse(item) as AppSettings;
        } catch (error) {
            console.warn('Failed to parse settings from localStorage', error);
            return null;
        }
    }

    updateSettings(updates: Partial<AppSettings>): void {
        const currentSettings = this.getSettings();
        if (!currentSettings) {
            throw new StorageError('No settings found to update');
        }

        const updatedSettings = {
            ...currentSettings,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveSettings(updatedSettings);
    }

    // Data export/import methods
    exportAllData(): ExportData {
        const leads = this.getLeads();
        const interactions = this.getInteractions();
        const settings = this.getSettings();

        const exportData: ExportData = {
            leads,
            interactions,
            settings: settings || {} as AppSettings,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };

        // Calculate checksum for data integrity
        exportData.checksum = this.calculateChecksum(exportData);

        return exportData;
    }

    importAllData(data: ExportData): ImportResult {
        try {
            // Validate data structure
            if (!data.leads || !Array.isArray(data.leads)) {
                return { success: false, message: 'Invalid leads data' };
            }

            if (!data.interactions || !Array.isArray(data.interactions)) {
                return { success: false, message: 'Invalid interactions data' };
            }

            // Verify checksum if present
            if (data.checksum) {
                const calculatedChecksum = this.calculateChecksum({ ...data, checksum: undefined });
                if (calculatedChecksum !== data.checksum) {
                    return { success: false, message: 'Data integrity check failed' };
                }
            }

            // Backup current data
            this.createBackup();

            // Import new data
            this.saveLeads(data.leads);
            this.saveInteractions(data.interactions);

            if (data.settings) {
                this.saveSettings({
                    ...data.settings,
                    updatedAt: new Date().toISOString()
                });
            }

            return {
                success: true,
                message: 'Data imported successfully',
                stats: {
                    leadsImported: data.leads.length,
                    interactionsImported: data.interactions.length,
                    settingsUpdated: !!data.settings
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `Import failed: ${(error as Error).message}`,
                errors: [(error as Error).message]
            };
        }
    }

    // Backup and restore methods
    private createBackup(): void {
        const timestamp = new Date().toISOString();
        const backupData = this.exportAllData();

        this.setItem(`backup_${timestamp}`, backupData);
        this.setItem(STORAGE_KEYS.LAST_BACKUP, timestamp);
    }

    getLastBackupDate(): string | null {
        try {
            return localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
        } catch {
            return null;
        }
    }

    // Utility methods
    private calculateChecksum(data: any): string {
        // Simple checksum calculation (in production, use a proper hash function)
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }

    getStorageUsage(): { used: number; available: number; percentage: number } {
        try {
            // Estimate storage usage
            let used = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    used += localStorage[key].length + key.length;
                }
            }

            // Most browsers have ~5-10MB limit for localStorage
            const estimated_limit = 5 * 1024 * 1024; // 5MB
            const available = estimated_limit - used;
            const percentage = (used / estimated_limit) * 100;

            return {
                used,
                available: Math.max(0, available),
                percentage: Math.min(100, percentage)
            };
        } catch {
            return { used: 0, available: 0, percentage: 0 };
        }
    }

    clearAllData(): void {
        try {
            this.removeItem(STORAGE_KEYS.LEADS);
            this.removeItem(STORAGE_KEYS.INTERACTIONS);
            this.removeItem(STORAGE_KEYS.SETTINGS);

            // Keep user preferences
            // this.removeItem(STORAGE_KEYS.USER_PREFERENCES);
        } catch (error) {
            throw new StorageError('Failed to clear data', error as Error);
        }
    }

    // Data migration methods (for future use)
    migrateData(fromVersion: string, toVersion: string): boolean {
        try {
            console.log(`Migrating data from version ${fromVersion} to ${toVersion}`);

            // Add migration logic here when needed
            // For now, just return true

            return true;
        } catch (error) {
            console.error('Data migration failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const localStorageService = LocalStorageService.getInstance();