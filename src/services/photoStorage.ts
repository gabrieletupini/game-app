// Firebase Storage service for photo uploads
// Stores photos in Firebase Storage and returns download URLs
// so they sync across devices (unlike base64 in localStorage)

import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'
import { v4 as uuidv4 } from 'uuid'

class PhotoStorageService {
    private static instance: PhotoStorageService

    static getInstance(): PhotoStorageService {
        if (!this.instance) {
            this.instance = new PhotoStorageService()
        }
        return this.instance
    }

    /**
     * Upload a base64 image to Firebase Storage.
     * Returns the public download URL.
     */
    async uploadPhoto(base64Data: string, leadId: string, type: 'profile' | 'gallery' = 'profile'): Promise<string> {
        const photoId = uuidv4()
        const path = `leads/${leadId}/${type}_${photoId}.jpg`
        const storageRef = ref(storage, path)

        // Upload the base64 string (data_url format: "data:image/jpeg;base64,...")
        await uploadString(storageRef, base64Data, 'data_url')

        // Get the public download URL
        const downloadUrl = await getDownloadURL(storageRef)
        return downloadUrl
    }

    /**
     * Delete a photo from Firebase Storage by its URL.
     * Silently fails if the photo doesn't exist.
     */
    async deletePhoto(url: string): Promise<void> {
        try {
            // Only delete Firebase Storage URLs (not base64 or other URLs)
            if (!url.includes('firebasestorage.googleapis.com') && !url.includes('firebasestorage.app')) return
            const storageRef = ref(storage, url)
            await deleteObject(storageRef)
        } catch (error) {
            console.warn('Failed to delete photo from storage:', error)
        }
    }

    /**
     * Check if a string is a base64 data URL (not yet uploaded to Storage)
     */
    isBase64(url: string): boolean {
        return url.startsWith('data:')
    }

    /**
     * If the photo is base64, upload it and return the URL.
     * If it's already a URL, return it as-is.
     */
    async ensureUploaded(photoUrl: string, leadId: string, type: 'profile' | 'gallery' = 'profile'): Promise<string> {
        if (!photoUrl) return photoUrl
        if (this.isBase64(photoUrl)) {
            return this.uploadPhoto(photoUrl, leadId, type)
        }
        return photoUrl
    }
}

export const photoStorageService = PhotoStorageService.getInstance()
