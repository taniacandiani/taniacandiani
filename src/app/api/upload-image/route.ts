import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
    
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen debe ser menor a 5MB' }, { status: 400 });
    }
    
    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', contentType, projectId);
    await mkdir(uploadDir, { recursive: true });
    
    // Generar nombre único para evitar conflictos
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const filename = `${timestamp}-${originalName}`;
    const filepath = path.join(uploadDir, filename);
    
    // Convertir archivo a buffer y guardarlo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);
    
    // Retornar URL de la imagen
    const imageUrl = `/uploads/${contentType}/${projectId}/${filename}`;
    
    return NextResponse.json({ 
      imageUrl,
      filename,
      originalName,
      size: file.size,
      type: file.type
    });
    
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor al subir la imagen' 
    }, { status: 500 });
  }
}
