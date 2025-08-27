import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'migrate-news-images') {
      const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
      const proyectosPath = path.join(uploadsPath, 'proyectos');
      const noticiasPath = path.join(uploadsPath, 'noticias');
      
      // Crear carpeta noticias si no existe
      await fs.mkdir(noticiasPath, { recursive: true });
      
      // Buscar carpetas que parezcan ser de noticias en proyectos
      const proyectosItems = await fs.readdir(proyectosPath);
      const migratedItems = [];
      
      for (const item of proyectosItems) {
        if (item === 'new-news' || item === 'noticia-1' || item.startsWith('noticia-')) {
          const sourcePath = path.join(proyectosPath, item);
          const targetPath = path.join(noticiasPath, item);
          
          try {
            // Mover la carpeta completa
            await fs.rename(sourcePath, targetPath);
            migratedItems.push({
              from: `proyectos/${item}`,
              to: `noticias/${item}`,
              status: 'migrated'
            });
          } catch (error) {
            console.error(`Error migrating ${item}:`, error);
            migratedItems.push({
              from: `proyectos/${item}`,
              to: `noticias/${item}`,
              status: 'error',
              error: error.message
            });
          }
        }
      }
      
      return NextResponse.json({
        message: 'Migración completada',
        migratedItems,
        totalMigrated: migratedItems.filter(item => item.status === 'migrated').length
      });
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error during migration:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor durante la migración' },
      { status: 500 }
    );
  }
}
