import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Configurar el límite de tamaño para permitir archivos de hasta 50MB
export const maxDuration = 60; // Tiempo máximo de ejecución en segundos
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const contentType = formData.get('contentType') as string || 'proyectos'; // Default a proyectos para compatibilidad

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    // Validar tipo de archivo - ahora aceptamos imágenes y PDFs
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    if (!isImage && !isPDF) {
      return NextResponse.json({ error: 'Solo se permiten archivos de imagen o PDF' }, { status: 400 });
    }

    // Validar tamaño (20MB para imágenes, 50MB para PDFs)
    const maxSize = isPDF ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = isPDF ? 50 : 20;
      return NextResponse.json({ error: `El archivo debe ser menor a ${maxSizeMB}MB` }, { status: 400 });
    }

    const originalName = file.name;
    const extension = file.name.split('.').pop()?.toLowerCase();

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Procesar archivo según su tipo
    let processedBuffer: Buffer;
    let mimeType: string;

    // Si es PDF, no procesar con Sharp
    if (isPDF) {
      processedBuffer = buffer;
      mimeType = 'application/pdf';
    } else {
      // Para imágenes, procesar con Sharp - Máxima calidad para portafolio de arte
      // Solo redimensionamos si la imagen es extremadamente grande
      const MAX_DIMENSION = 4000; // Aumentado de 2000 a 4000 píxeles para mejor calidad

      // Obtener dimensiones de la imagen original
      const imageInfo = await sharp(buffer).metadata();
      const needsResize = (imageInfo.width && imageInfo.width > MAX_DIMENSION) ||
                          (imageInfo.height && imageInfo.height > MAX_DIMENSION);

      if (extension === 'jpg' || extension === 'jpeg') {
        // JPEG con calidad máxima (100% para evitar pérdida de calidad)
        const sharpInstance = sharp(buffer);

        if (needsResize) {
          sharpInstance.resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true,
            kernel: sharp.kernel.lanczos3 // Mejor algoritmo de interpolación
          });
        }

        processedBuffer = await sharpInstance
          .jpeg({
            quality: 100, // Máxima calidad
            progressive: true,
            mozjpeg: true // Usar mozjpeg para mejor compresión sin pérdida de calidad
          })
          .toBuffer();
        mimeType = 'image/jpeg';
      } else if (extension === 'png') {
        // PNG con mejor compresión sin pérdida de calidad
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
            compressionLevel: 6, // Balanceado (0-9, donde 9 es máxima compresión pero más lento)
            quality: 100,
            effort: 7 // Mayor esfuerzo en compresión sin pérdida
          })
          .toBuffer();
        mimeType = 'image/png';
      } else if (extension === 'webp') {
        // WebP con alta calidad
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
            quality: 95, // Alta calidad para WebP
            lossless: false, // Usar compresión con pérdida controlada
            effort: 6 // Mayor esfuerzo en compresión
          })
          .toBuffer();
        mimeType = 'image/webp';
      } else {
        // Para otros formatos, mantener sin cambios si es posible
        if (needsResize) {
          processedBuffer = await sharp(buffer)
            .resize(MAX_DIMENSION, MAX_DIMENSION, {
              fit: 'inside',
              withoutEnlargement: true,
              kernel: sharp.kernel.lanczos3
            })
            .toBuffer();
        } else {
          // No procesar, usar buffer original
          processedBuffer = buffer;
        }
        mimeType = file.type;
      }
    }

    const finalSize = processedBuffer.length;
    const compressionRatio = ((1 - finalSize / file.size) * 100).toFixed(1);

    console.log(`Imagen optimizada: ${originalName} (${(file.size / 1024 / 1024).toFixed(2)}MB) → (${(finalSize / 1024 / 1024).toFixed(2)}MB) - ${compressionRatio}% de reducción`);

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(processedBuffer, contentType);

    return NextResponse.json({
      imageUrl: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      format: cloudinaryResult.format,
      originalName,
      originalSize: file.size,
      compressedSize: finalSize,
      compressionRatio: `${compressionRatio}%`,
      type: mimeType
    });

  } catch (error) {
    console.error('Error al subir imagen:', error);

    // Proporcionar más detalles sobre el error
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorDetails = {
      error: 'Error al procesar la imagen',
      details: errorMessage,
      timestamp: new Date().toISOString()
    };

    console.error('Detalles completos del error:', errorDetails);

    return NextResponse.json(errorDetails, { status: 500 });
  }
}
