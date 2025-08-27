import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const { filePath } = await request.json();
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'Ruta del archivo es requerida' },
        { status: 400 }
      );
    }

    // Construir la ruta completa del archivo
    const fullPath = path.join(process.cwd(), 'public', filePath);
    
    // Verificar que la ruta esté dentro de la carpeta uploads por seguridad
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
    if (!fullPath.startsWith(uploadsPath)) {
      return NextResponse.json(
        { error: 'Ruta de archivo no válida' },
        { status: 403 }
      );
    }

    // Verificar que el archivo existe
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json(
        { error: 'Archivo no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el archivo
    await fs.unlink(fullPath);
    
    return NextResponse.json({
      message: 'Archivo eliminado correctamente',
      deletedPath: filePath
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
