import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Upload image to Cloudinary
 * @param file - File as base64 or buffer
 * @param folder - Folder path in Cloudinary (e.g., "proyectos", "noticias")
 * @returns Cloudinary upload result with URL and metadata
 */
export async function uploadToCloudinary(
  file: string | Buffer,
  folder: string = 'uploads'
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(
      typeof file === 'string' ? file : `data:image/png;base64,${file.toString('base64')}`,
      {
        folder,
        resource_type: 'image',
        quality: 'auto:best', // Cloudinary usará la mejor calidad posible
        fetch_format: 'auto', // Cloudinary elegirá el mejor formato según el navegador
        flags: 'preserve_transparency', // Preservar transparencia en PNGs
        // No aplicar transformaciones adicionales - Sharp ya optimizó la imagen
        // Cloudinary solo almacena sin comprimir más
      }
    );

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

/**
 * Rename/move an image in Cloudinary from one folder to another
 * @param fromPublicId - Current public ID (e.g., "proyectos/temp-123/image")
 * @param toPublicId - New public ID (e.g., "proyectos/my-project/image")
 * @returns New secure URL
 */
export async function renameInCloudinary(fromPublicId: string, toPublicId: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.rename(fromPublicId, toPublicId, {
      overwrite: false,
      invalidate: true
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error renaming in Cloudinary:', error);
    throw new Error(`Failed to rename ${fromPublicId} to ${toPublicId}`);
  }
}

/**
 * Move all images from a temporary folder to a permanent folder
 * @param tempFolder - Temporary folder path (e.g., "proyectos/temp-123")
 * @param permanentFolder - Permanent folder path (e.g., "proyectos/my-project-slug")
 * @returns Object mapping old URLs to new URLs
 */
export async function moveFolderInCloudinary(
  tempFolder: string,
  permanentFolder: string
): Promise<{ [oldUrl: string]: string }> {
  try {
    // Get all resources in the temp folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      prefix: tempFolder,
      max_results: 500
    });

    const urlMap: { [oldUrl: string]: string } = {};

    // Rename each resource
    for (const resource of result.resources) {
      const oldPublicId = resource.public_id;
      const oldUrl = resource.secure_url;

      // Extract the filename from the public_id
      const fileName = oldPublicId.split('/').pop();
      const newPublicId = `${permanentFolder}/${fileName}`;

      try {
        const newUrl = await renameInCloudinary(oldPublicId, newPublicId);
        urlMap[oldUrl] = newUrl;
        console.log(`Renamed: ${oldPublicId} -> ${newPublicId}`);
      } catch (error) {
        console.error(`Failed to rename ${oldPublicId}:`, error);
        // Continue with other images even if one fails
      }
    }

    return urlMap;
  } catch (error) {
    console.error('Error moving folder in Cloudinary:', error);
    throw new Error(`Failed to move folder from ${tempFolder} to ${permanentFolder}`);
  }
}

/**
 * Upload file (image or PDF) to Cloudinary
 * @param file - File as base64 or buffer
 * @param folder - Folder path in Cloudinary (e.g., "acerca/publicaciones")
 * @param resourceType - Type of resource: 'image', 'raw' (for PDFs), or 'auto'
 * @param mimeType - Optional MIME type for the file
 * @param fileName - Optional file name for the upload
 * @returns Cloudinary upload result with URL and metadata
 */
export async function uploadFileToCloudinary(
  file: string | Buffer,
  folder: string = 'uploads',
  resourceType: 'image' | 'raw' | 'auto' = 'auto',
  mimeType?: string,
  fileName?: string
): Promise<CloudinaryUploadResult> {
  try {
    // Determinar el formato del archivo para base64
    let base64String: string;
    if (typeof file === 'string') {
      base64String = file;
    } else {
      // Usar el mimeType proporcionado o determinar por resourceType
      let prefix: string;
      if (mimeType) {
        prefix = `data:${mimeType};base64,`;
      } else if (resourceType === 'raw') {
        prefix = 'data:application/pdf;base64,';
      } else {
        prefix = 'data:image/png;base64,';
      }
      base64String = `${prefix}${file.toString('base64')}`;
    }

    // Configurar opciones de upload
    const uploadOptions: any = {
      folder,
      resource_type: resourceType,
    };

    // Para PDFs y archivos raw
    if (resourceType === 'raw') {
      // Generar un nombre único con extensión .pdf
      if (fileName) {
        const timestamp = Date.now();
        const cleanName = fileName.replace(/\.pdf$/i, '');
        // Importante: incluir .pdf en el public_id para que Cloudinary lo reconozca
        uploadOptions.public_id = `${cleanName}_${timestamp}.pdf`;
      }
      // No especificar format, dejar que Cloudinary lo detecte del public_id
    }

    // Para imágenes mantener configuración de calidad
    if (resourceType === 'image') {
      uploadOptions.quality = 'auto:best';
      uploadOptions.fetch_format = 'auto';
      uploadOptions.flags = 'preserve_transparency';
    }

    const result = await cloudinary.uploader.upload(
      base64String,
      uploadOptions
    );

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width || 0,
      height: result.height || 0,
      format: result.format,
    };
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

export default cloudinary;
