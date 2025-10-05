import cloudinary from './cloudinary';

/**
 * Move/rename an image in Cloudinary from one folder to another
 * @param oldPublicId - Current public_id of the image (e.g., "proyectos/temp-123/image.jpg")
 * @param newPublicId - New public_id for the image (e.g., "proyectos/mi-proyecto/image.jpg")
 */
export async function moveImageInCloudinary(oldPublicId: string, newPublicId: string): Promise<void> {
  try {
    await cloudinary.uploader.rename(oldPublicId, newPublicId);
    console.log(`Moved image from ${oldPublicId} to ${newPublicId}`);
  } catch (error) {
    console.error(`Error moving image from ${oldPublicId} to ${newPublicId}:`, error);
    throw error;
  }
}

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

/**
 * Move all images from a temporary folder to the final project folder
 * @param imageUrls - Array of Cloudinary URLs
 * @param tempFolder - Temporary folder path (e.g., "proyectos/temp-123")
 * @param finalFolder - Final folder path (e.g., "proyectos/mi-proyecto")
 * @returns Array of new Cloudinary URLs
 */
export async function moveProjectImages(
  imageUrls: string[],
  tempFolder: string,
  finalFolder: string
): Promise<string[]> {
  const newUrls: string[] = [];

  for (const url of imageUrls) {
    const publicId = extractPublicIdFromUrl(url);

    if (!publicId) {
      console.warn(`Could not extract public_id from URL: ${url}`);
      newUrls.push(url); // Keep original URL if we can't extract public_id
      continue;
    }

    // Check if image is in temp folder
    if (!publicId.startsWith(tempFolder)) {
      console.log(`Image ${publicId} is not in temp folder, keeping as is`);
      newUrls.push(url); // Keep original URL if not in temp folder
      continue;
    }

    try {
      // Create new public_id by replacing temp folder with final folder
      const fileName = publicId.replace(`${tempFolder}/`, '');
      const newPublicId = `${finalFolder}/${fileName}`;

      // Move the image
      await moveImageInCloudinary(publicId, newPublicId);

      // Reconstruct the new URL
      const newUrl = url.replace(publicId, newPublicId);
      newUrls.push(newUrl);
    } catch (error) {
      console.error(`Failed to move image ${publicId}:`, error);
      newUrls.push(url); // Keep original URL if move fails
    }
  }

  return newUrls;
}

/**
 * Generate a temporary folder name for new projects
 * @returns Temporary folder path (e.g., "proyectos/temp-1234567890")
 */
export function generateTempFolder(): string {
  const timestamp = Date.now();
  return `proyectos/temp-${timestamp}`;
}
