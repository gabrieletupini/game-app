// Image processing and management service

import { APP_CONFIG } from '../utils/constants';

export class ImageError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'ImageError';
    }
}

export class ImageService {
    private static instance: ImageService;

    static getInstance(): ImageService {
        if (!this.instance) {
            this.instance = new ImageService();
        }
        return this.instance;
    }

    /**
     * Convert a file to Base64 string
     */
    async convertToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            // Validate file type
            if (!APP_CONFIG.SUPPORTED_IMAGE_TYPES.includes(file.type as any)) {
                reject(new ImageError(
                    `Unsupported file type: ${file.type}. Supported types: ${APP_CONFIG.SUPPORTED_IMAGE_TYPES.join(', ')}`,
                    'UNSUPPORTED_TYPE'
                ));
                return;
            }

            // Validate file size
            if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
                reject(new ImageError(
                    `File size too large: ${this.formatFileSize(file.size)}. Maximum allowed: ${this.formatFileSize(APP_CONFIG.MAX_FILE_SIZE)}`,
                    'FILE_TOO_LARGE'
                ));
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new ImageError('Failed to convert file to Base64', 'CONVERSION_ERROR'));
                }
            };

            reader.onerror = () => {
                reject(new ImageError('Failed to read file', 'READ_ERROR'));
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Resize image to specified dimensions
     */
    async resizeImage(
        base64: string,
        maxWidth: number = 300,
        maxHeight: number = 300,
        quality: number = 0.8
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        reject(new ImageError('Failed to get canvas context', 'CANVAS_ERROR'));
                        return;
                    }

                    // Calculate new dimensions maintaining aspect ratio
                    let { width, height } = this.calculateNewDimensions(
                        img.width,
                        img.height,
                        maxWidth,
                        maxHeight
                    );

                    canvas.width = width;
                    canvas.height = height;

                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert back to base64 with compression
                    const resizedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(resizedBase64);
                } catch (error) {
                    reject(new ImageError('Failed to resize image', 'RESIZE_ERROR'));
                }
            };

            img.onerror = () => {
                reject(new ImageError('Failed to load image for resizing', 'IMAGE_LOAD_ERROR'));
            };

            img.src = base64;
        });
    }

    /**
     * Create thumbnail from image
     */
    async createThumbnail(base64: string, size: number = 150): Promise<string> {
        return this.resizeImage(base64, size, size, 0.7);
    }

    /**
     * Optimize image for storage (compress and resize)
     */
    async optimizeForStorage(base64: string): Promise<string> {
        try {
            // First resize to reasonable dimensions
            const resized = await this.resizeImage(base64, 400, 400, 0.85);

            // Check if the result is smaller, otherwise use original
            if (resized.length < base64.length) {
                return resized;
            }

            return base64;
        } catch (error) {
            console.warn('Image optimization failed, using original:', error);
            return base64;
        }
    }

    /**
     * Extract image metadata
     */
    getImageInfo(base64: string): Promise<{
        width: number;
        height: number;
        size: number;
        type: string;
    }> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                // Extract MIME type from base64 string
                const mimeMatch = base64.match(/^data:([^;]+);base64,/);
                const type = mimeMatch ? mimeMatch[1] : 'unknown';

                // Estimate size (base64 is ~1.37x larger than binary)
                const base64Length = base64.replace(/^data:[^;]+;base64,/, '').length;
                const estimatedSize = Math.round(base64Length * 0.75);

                resolve({
                    width: img.width,
                    height: img.height,
                    size: estimatedSize,
                    type
                });
            };

            img.onerror = () => {
                reject(new ImageError('Failed to load image for info extraction'));
            };

            img.src = base64;
        });
    }

    /**
     * Validate image dimensions
     */
    async validateImageDimensions(
        base64: string,
        minWidth?: number,
        minHeight?: number,
        maxWidth?: number,
        maxHeight?: number
    ): Promise<boolean> {
        try {
            const info = await this.getImageInfo(base64);

            if (minWidth && info.width < minWidth) return false;
            if (minHeight && info.height < minHeight) return false;
            if (maxWidth && info.width > maxWidth) return false;
            if (maxHeight && info.height > maxHeight) return false;

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Process uploaded file for lead profile photo
     */
    async processProfilePhoto(file: File): Promise<{
        original: string;
        optimized: string;
        thumbnail: string;
        info: {
            width: number;
            height: number;
            size: number;
            type: string;
        };
    }> {
        try {
            // Convert to base64
            const original = await this.convertToBase64(file);

            // Get image info
            const info = await this.getImageInfo(original);

            // Create optimized version for storage
            const optimized = await this.optimizeForStorage(original);

            // Create thumbnail for quick display
            const thumbnail = await this.createThumbnail(optimized);

            return {
                original,
                optimized,
                thumbnail,
                info
            };
        } catch (error) {
            if (error instanceof ImageError) {
                throw error;
            }
            throw new ImageError('Failed to process profile photo');
        }
    }

    /**
     * Helper method to format file size
     */
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Calculate new dimensions maintaining aspect ratio
     */
    private calculateNewDimensions(
        originalWidth: number,
        originalHeight: number,
        maxWidth: number,
        maxHeight: number
    ): { width: number; height: number } {
        let width = originalWidth;
        let height = originalHeight;

        // Calculate scaling factor
        const widthRatio = maxWidth / originalWidth;
        const heightRatio = maxHeight / originalHeight;
        const scalingFactor = Math.min(widthRatio, heightRatio, 1); // Don't upscale

        width = Math.round(originalWidth * scalingFactor);
        height = Math.round(originalHeight * scalingFactor);

        return { width, height };
    }

    /**
     * Generate placeholder image (for when no photo is provided)
     */
    generatePlaceholder(
        initials: string,
        size: number = 300,
        backgroundColor: string = '#6B7280',
        textColor: string = '#FFFFFF'
    ): string {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new ImageError('Failed to create placeholder image');
        }

        canvas.width = size;
        canvas.height = size;

        // Draw background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, size, size);

        // Draw initials
        ctx.fillStyle = textColor;
        ctx.font = `${Math.round(size * 0.4)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials.toUpperCase(), size / 2, size / 2);

        return canvas.toDataURL('image/png');
    }

    /**
     * Extract initials from name for placeholder
     */
    getInitials(name: string): string {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

    /**
     * Get a consistent color for a name (for placeholder backgrounds)
     */
    getColorForName(name: string): string {
        const colors = [
            '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
            '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
        ];

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    }
}

// Export singleton instance
export const imageService = ImageService.getInstance();