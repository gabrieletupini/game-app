// Firestore service — primary storage with localStorage as offline cache
// Uses a single document per collection for simplicity (same pattern as localStorage)

import {
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore'
import { db } from './firebase'
import { localStorageService } from './localStorage'
import type { Lead, Interaction, AppSettings } from '../types'

// Firestore document paths — we store all data in a single user doc
// (Since this is a single-user app, we use a fixed doc ID)
const USER_DOC = 'default'
const COLLECTIONS = {
    leads: 'app-data',
    interactions: 'app-data',
    settings: 'app-data',
} as const

// We store everything in one document: { leads: [...], interactions: [...], settings: {...} }
const DATA_DOC_REF = doc(db, COLLECTIONS.leads, USER_DOC)

type AppData = {
    leads: Lead[]
    interactions: Interaction[]
    settings: AppSettings | null
    updatedAt: string
}

class FirestoreService {
    private static instance: FirestoreService
    private unsubscribe: Unsubscribe | null = null
    private onDataChange: ((data: AppData) => void) | null = null
    private isWriting = false // prevent echo from our own writes

    static getInstance(): FirestoreService {
        if (!this.instance) {
            this.instance = new FirestoreService()
        }
        return this.instance
    }

    private constructor() { }

    // Subscribe to real-time updates from Firestore
    subscribeToChanges(callback: (data: AppData) => void): Unsubscribe {
        this.onDataChange = callback

        this.unsubscribe = onSnapshot(
            DATA_DOC_REF,
            (snapshot) => {
                if (this.isWriting) return // skip echoes from our own writes

                if (snapshot.exists()) {
                    const data = snapshot.data() as AppData
                    // Update localStorage cache
                    localStorageService.saveLeads(data.leads || [])
                    localStorageService.saveInteractions(data.interactions || [])
                    if (data.settings) localStorageService.saveSettings(data.settings)

                    if (this.onDataChange) {
                        this.onDataChange(data)
                    }
                }
            },
            (error) => {
                console.warn('Firestore subscription error, falling back to localStorage:', error)
            }
        )

        return this.unsubscribe
    }

    unsubscribeFromChanges(): void {
        if (this.unsubscribe) {
            this.unsubscribe()
            this.unsubscribe = null
        }
    }

    // Load all data — tries Firestore first, falls back to localStorage
    async loadAll(): Promise<AppData> {
        try {
            const snapshot = await getDoc(DATA_DOC_REF)

            if (snapshot.exists()) {
                const data = snapshot.data() as AppData
                // Sync to localStorage cache
                localStorageService.saveLeads(data.leads || [])
                localStorageService.saveInteractions(data.interactions || [])
                if (data.settings) localStorageService.saveSettings(data.settings)
                return data
            }

            // Document doesn't exist yet — check localStorage for existing data
            const localData: AppData = {
                leads: localStorageService.getLeads(),
                interactions: localStorageService.getInteractions(),
                settings: localStorageService.getSettings(),
                updatedAt: new Date().toISOString()
            }

            // If localStorage has data, seed Firestore with it
            if (localData.leads.length > 0 || localData.interactions.length > 0) {
                await this.saveAll(localData)
            }

            return localData
        } catch (error) {
            console.warn('Firestore load failed, falling back to localStorage:', error)
            return {
                leads: localStorageService.getLeads(),
                interactions: localStorageService.getInteractions(),
                settings: localStorageService.getSettings(),
                updatedAt: new Date().toISOString()
            }
        }
    }

    // Save entire state to Firestore + localStorage cache
    async saveAll(data: Partial<AppData>): Promise<void> {
        const now = new Date().toISOString()
        const payload = { ...data, updatedAt: now }

        // Always save to localStorage immediately (fast, offline-safe)
        if (data.leads) localStorageService.saveLeads(data.leads)
        if (data.interactions) localStorageService.saveInteractions(data.interactions)
        if (data.settings) localStorageService.saveSettings(data.settings)

        // Then save to Firestore (async, might fail if offline)
        try {
            this.isWriting = true
            await setDoc(DATA_DOC_REF, payload, { merge: true })
        } catch (error) {
            console.warn('Firestore save failed (data is safe in localStorage):', error)
        } finally {
            this.isWriting = false
        }
    }

    // Convenience: save just leads
    async saveLeads(leads: Lead[]): Promise<void> {
        localStorageService.saveLeads(leads)
        try {
            this.isWriting = true
            await setDoc(DATA_DOC_REF, { leads, updatedAt: new Date().toISOString() }, { merge: true })
        } catch (error) {
            console.warn('Firestore saveLeads failed:', error)
        } finally {
            this.isWriting = false
        }
    }

    // Convenience: save just interactions
    async saveInteractions(interactions: Interaction[]): Promise<void> {
        localStorageService.saveInteractions(interactions)
        try {
            this.isWriting = true
            await setDoc(DATA_DOC_REF, { interactions, updatedAt: new Date().toISOString() }, { merge: true })
        } catch (error) {
            console.warn('Firestore saveInteractions failed:', error)
        } finally {
            this.isWriting = false
        }
    }

    // Convenience: save just settings
    async saveSettings(settings: AppSettings): Promise<void> {
        localStorageService.saveSettings(settings)
        try {
            this.isWriting = true
            await setDoc(DATA_DOC_REF, { settings, updatedAt: new Date().toISOString() }, { merge: true })
        } catch (error) {
            console.warn('Firestore saveSettings failed:', error)
        } finally {
            this.isWriting = false
        }
    }

    // Clear all data from Firestore + localStorage
    async clearAll(): Promise<void> {
        localStorageService.clearAllData()
        try {
            this.isWriting = true
            await setDoc(DATA_DOC_REF, {
                leads: [],
                interactions: [],
                settings: null,
                updatedAt: new Date().toISOString()
            })
        } catch (error) {
            console.warn('Firestore clearAll failed:', error)
        } finally {
            this.isWriting = false
        }
    }
}

export const firestoreService = FirestoreService.getInstance()
