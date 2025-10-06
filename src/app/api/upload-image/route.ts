import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const contentType = formData.get('contentType') as string || 'proyectos'; // Default a proyectos para compatibilidad

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten archivos de imagen' }, { status: 400 });
    }

    // Validar tamaño (20MB máximo)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen debe ser menor a 20MB' }, { status: 400 });
    }

    const originalName = file.name;
    const extension = file.name.split('.').pop()?.toLowerCase();

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Procesar imagen con Sharp - Máxima calidad para portafolio de arte
    let processedBuffer: Buffer;
    let mimeType: string;

    // Para un portafolio de arte, mantenemos la máxima calidad posible
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
