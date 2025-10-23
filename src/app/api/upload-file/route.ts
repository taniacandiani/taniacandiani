import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { uploadFileToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contentType = formData.get('contentType') as string || 'acerca/publicaciones';

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    const fileType = file.type;
    const isPDF = fileType === 'application/pdf';
    const isImage = fileType.startsWith('image/');

    // Validar que sea PDF o imagen
    if (!isPDF && !isImage) {
      return NextResponse.json({
        error: 'Solo se permiten archivos PDF o imágenes'
      }, { status: 400 });
    }

    // Validar tamaño (20MB máximo)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({
        error: 'El archivo debe ser menor a 20MB'
      }, { status: 400 });
    }

    const originalName = file.name;
    const extension = file.name.split('.').pop()?.toLowerCase();

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let cloudinaryResult;
    let processedBuffer: Buffer;
    let mimeType: string;
    let finalSize: number;

    if (isPDF) {
      // Para PDFs, subir directamente sin procesamiento
      cloudinaryResult = await uploadFileToCloudinary(buffer, contentType, 'raw');
      processedBuffer = buffer;
      mimeType = 'application/pdf';
      finalSize = buffer.length;

      console.log(`PDF subido: ${originalName} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      return NextResponse.json({
        fileUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        format: cloudinaryResult.format,
        originalName,
        originalSize: file.size,
        compressedSize: finalSize,
        type: mimeType,
        isPDF: true
      });
    } else {
      // Para imágenes, procesar con Sharp (igual que en upload-image)
      const MAX_DIMENSION = 4000;
      const imageInfo = await sharp(buffer).metadata();
      const needsResize = (imageInfo.width && imageInfo.width > MAX_DIMENSION) ||
                          (imageInfo.height && imageInfo.height > MAX_DIMENSION);

      if (extension === 'jpg' || extension === 'jpeg') {
        const sharpInstance = sharp(buffer);
        if (needsResize) {
          sharpInstance.resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true,
            kernel: sharp.kernel.lanczos3
          });
        }
        processedBuffer = await sharpInstance
          .jpeg({
            quality: 100,
            progressive: true,
            mozjpeg: true
          })
          .toBuffer();
        mimeType = 'image/jpeg';
      } else if (extension === 'png') {
        const sharpInstance = sharp(buffer);
        if (needsResize) {
          sharpInstance.resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true,
            kernel: sharp.kernel.lanczos3
          });
        }
        processedBuffer = await sharpInstance
          .png({
            compressionLevel: 6,
            quality: 100,
            effort: 7
          })
          .toBuffer();
        mimeType = 'image/png';
      } else if (extension === 'webp') {
        const sharpInstance = sharp(buffer);
        if (needsResize) {
          sharpInstance.resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true,
            kernel: sharp.kernel.lanczos3
          });
        }
        processedBuffer = await sharpInstance
          .webp({
            quality: 95,
            lossless: false,
            effort: 6
          })
          .toBuffer();
        mimeType = 'image/webp';
      } else {
        if (needsResize) {
          processedBuffer = await sharp(buffer)
            .resize(MAX_DIMENSION, MAX_DIMENSION, {
              fit: 'inside',
              withoutEnlargement: true,
              kernel: sharp.kernel.lanczos3
            })
            .toBuffer();
        } else {
          processedBuffer = buffer;
        }
        mimeType = file.type;
      }

      finalSize = processedBuffer.length;
      const compressionRatio = ((1 - finalSize / file.size) * 100).toFixed(1);

      console.log(`Imagen optimizada: ${originalName} (${(file.size / 1024 / 1024).toFixed(2)}MB) → (${(finalSize / 1024 / 1024).toFixed(2)}MB) - ${compressionRatio}% de reducción`);

      // Upload to Cloudinary
      cloudinaryResult = await uploadFileToCloudinary(processedBuffer, contentType, 'image');

      return NextResponse.json({
        fileUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
        originalName,
        originalSize: file.size,
        compressedSize: finalSize,
        compressionRatio: `${compressionRatio}%`,
        type: mimeType,
        isPDF: false
      });
    }

  } catch (error) {
    console.error('Error al subir archivo:', error);

    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorDetails = {
      error: 'Error al procesar el archivo',
      details: errorMessage,
      timestamp: new Date().toISOString()
    };

    console.error('Detalles completos del error:', errorDetails);

    return NextResponse.json(errorDetails, { status: 500 });
  }
}
