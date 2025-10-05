import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const projectId = formData.get('projectId') as string;
    const contentType = formData.get('contentType') as string || 'proyectos'; // Default a proyectos para compatibilidad

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: 'ID del proyecto requerido' }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten archivos de imagen' }, { status: 400 });
    }

    // Validar tamaño (20MB máximo)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen debe ser menor a 20MB' }, { status: 400 });
    }
    
    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', contentType, projectId);
    await mkdir(uploadDir, { recursive: true });

    // Generar nombre único para evitar conflictos
    const timestamp = Date.now();
    const originalName = file.name;
    const nameWithoutExt = path.parse(originalName).name;
    const extension = path.extname(originalName).toLowerCase();

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Comprimir y optimizar imagen con Sharp
    let processedBuffer: Buffer;
    let finalExtension: string;
    let mimeType: string;

    // Determinar formato de salida basado en el tamaño original
    const shouldConvertToWebP = file.size > 2 * 1024 * 1024; // Convertir a WebP si es > 2MB

    if (shouldConvertToWebP && (extension === '.jpg' || extension === '.jpeg' || extension === '.png')) {
      // Convertir a WebP para mejor compresión
      processedBuffer = await sharp(buffer)
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 85 })
        .toBuffer();
      finalExtension = '.webp';
      mimeType = 'image/webp';
    } else if (extension === '.jpg' || extension === '.jpeg') {
      // Optimizar JPEG
      processedBuffer = await sharp(buffer)
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
      finalExtension = '.jpg';
      mimeType = 'image/jpeg';
    } else if (extension === '.png') {
      // Optimizar PNG
      processedBuffer = await sharp(buffer)
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({ compressionLevel: 9 })
        .toBuffer();
      finalExtension = '.png';
      mimeType = 'image/png';
    } else {
      // Para otros formatos (GIF, etc.), solo redimensionar sin cambiar formato
      processedBuffer = await sharp(buffer)
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toBuffer();
      finalExtension = extension;
      mimeType = file.type;
    }

    const filename = `${timestamp}-${nameWithoutExt}${finalExtension}`;
    const filepath = path.join(uploadDir, filename);

    // Guardar imagen procesada
    await writeFile(filepath, processedBuffer);

    // Retornar URL de la imagen
    const imageUrl = `/uploads/${contentType}/${projectId}/${filename}`;

    const finalSize = processedBuffer.length;
    const compressionRatio = ((1 - finalSize / file.size) * 100).toFixed(1);

    console.log(`Imagen optimizada: ${originalName} (${(file.size / 1024 / 1024).toFixed(2)}MB) → ${filename} (${(finalSize / 1024 / 1024).toFixed(2)}MB) - ${compressionRatio}% de reducción`);

    return NextResponse.json({
      imageUrl,
      filename,
      originalName,
      originalSize: file.size,
      compressedSize: finalSize,
      compressionRatio: `${compressionRatio}%`,
      type: mimeType
    });
    
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor al subir la imagen' 
    }, { status: 500 });
  }
}
