// This file contains CLIENT-SAFE utilities that don't require the Cloudinary SDK
// Server-side functions should remain in cloudinary.ts

/**
 * Extract public_id from Cloudinary URL
 * @param url - Cloudinary URL (e.g., "https://res.cloudinary.com/dodlnjrmg/image/upload/v123/proyectos/temp-123/image.jpg")
 * @returns public_id (e.g., "proyectos/temp-123/image")
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return null;
  }
}

// Note: moveProjectImages function has been moved to server-side cloudinary.ts
// as it requires the Cloudinary SDK for renaming operations

/**
 * Generate a temporary folder name for new projects
 * @returns Temporary folder path (e.g., "proyectos/temp-1234567890")
 */
export function generateTempFolder(): string {
  const timestamp = Date.now();
  return `proyectos/temp-${timestamp}`;
}

/**
 * Client-side Cloudinary URL optimization utilities
 * These work with URLs directly without requiring the Cloudinary SDK
 */

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'fill' | 'fit' | 'scale' | 'limit';
  gravity?: 'auto' | 'center' | 'face';
  dpr?: 'auto' | number;
}

/**
 * Optimizes a Cloudinary URL with automatic transformations
 * This reduces file sizes significantly without quality loss
 *
 * @param url - Original Cloudinary URL
 * @param options - Transformation options
 * @returns Optimized URL with transformations
 */
export function optimizeCloudinaryUrl(
  url: string,
  options: CloudinaryTransformOptions = {}
): string {
  // If not a Cloudinary URL, return as-is
  if (!url || !url.includes('res.cloudinary.com')) {
    return url;
  }

  const {
    width,
    height,
    quality = 'auto:good',
    format = 'auto',
    crop = 'limit',
    gravity,
    dpr = 'auto',
  } = options;

  // Build transformation string
  const transformations: string[] = [];

  // Format and quality (most important for file size)
  transformations.push(`f_${format}`);
  transformations.push(`q_${quality}`);

  // DPR for responsive images
  if (dpr) transformations.push(`dpr_${dpr}`);

  // Dimensions
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (gravity) transformations.push(`g_${gravity}`);

  // Combine transformations
  const transformStr = transformations.join(',');

  // Insert transformations into URL
  // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{path}
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  const beforeUpload = url.substring(0, uploadIndex + 8); // Include '/upload/'
  const afterUpload = url.substring(uploadIndex + 8);

  // Check if transformations already exist and remove them
  const versionMatch = afterUpload.match(/^(.+?\/)?(v\d+\/.+)$/);
  if (versionMatch) {
    // Has version, insert before it
    return `${beforeUpload}${transformStr}/${versionMatch[2]}`;
  }

  // No version, just append
  return `${beforeUpload}${transformStr}/${afterUpload}`;
}

/**
 * Preset configurations for common use cases
 */
export const CLOUDINARY_PRESETS = {
  hero: {
    width: 1920,
    quality: 'auto:eco',
    format: 'auto',
    crop: 'limit',
    dpr: 'auto'
  } as CloudinaryTransformOptions,
  thumbnail: {
    width: 400,
    quality: 'auto:eco',
    format: 'auto',
    crop: 'fill',
    dpr: 'auto'
  } as CloudinaryTransformOptions,
  card: {
    width: 600,
    quality: 'auto:eco',
    format: 'auto',
    crop: 'limit',
    dpr: 'auto'
  } as CloudinaryTransformOptions,
  fullscreen: {
    width: 2048,
    quality: 'auto:good',
    format: 'auto',
    crop: 'limit',
    dpr: 'auto'
  } as CloudinaryTransformOptions,
} as const;
