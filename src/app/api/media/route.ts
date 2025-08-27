import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface MediaFile {
  name: string;
  path: string;
  type: 'image' | 'document' | 'folder';
  size?: string;
  lastModified?: string;
}

interface MediaFolder {
  name: string;
  path: string;
  files: MediaFile[];
  subfolders: MediaFolder[];
}

async function getFileStats(filePath: string): Promise<{ size: string; lastModified: string }> {
  try {
    const stats = await fs.stat(filePath);
    const size = stats.size < 1024 * 1024 
      ? `${Math.round(stats.size / 1024)} KB`
      : `${Math.round(stats.size / (1024 * 1024) * 10) / 10} MB`;
    
    return {
      size,
      lastModified: stats.mtime.toISOString().split('T')[0]
    };
  } catch {
    return { size: '0 KB', lastModified: 'N/A' };
  }
}

async function scanDirectory(dirPath: string, basePath: string): Promise<MediaFolder> {
  const items = await fs.readdir(dirPath);
  const files: MediaFile[] = [];
  const subfolders: MediaFolder[] = [];

  for (const item of items) {
    if (item.startsWith('.') || item === 'node_modules') continue;
    
    const fullPath = path.join(dirPath, item);
    const relativePath = path.join(basePath, item).replace(/\\/g, '/');
    
    try {
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        const subfolder = await scanDirectory(fullPath, relativePath);
        subfolders.push(subfolder);
      } else {
        const fileStats = await getFileStats(fullPath);
        const fileExtension = path.extname(item).toLowerCase();
        
        let fileType: 'image' | 'document' = 'document';
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(fileExtension)) {
          fileType = 'image';
        }
        
        files.push({
          name: item,
          path: `/${relativePath}`,
          type: fileType,
          size: fileStats.size,
          lastModified: fileStats.lastModified
        });
      }
    } catch (error) {
      console.error(`Error reading ${fullPath}:`, error);
    }
  }

  return {
    name: path.basename(dirPath),
    path: `/${basePath}`,
    files: files.sort((a, b) => a.name.localeCompare(b.name)),
    subfolders: subfolders.sort((a, b) => a.name.localeCompare(b.name))
  };
}

export async function GET(request: NextRequest) {
  try {
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
    
    // Verificar si existe la carpeta uploads
    try {
      await fs.access(uploadsPath);
    } catch {
      return NextResponse.json({ 
        structure: [],
        message: 'No se encontró la carpeta de uploads'
      });
    }

    const structure = await scanDirectory(uploadsPath, 'uploads');
    
    return NextResponse.json({
      structure: [structure],
      message: 'Estructura de archivos obtenida correctamente'
    });
  } catch (error) {
    console.error('Error scanning media directory:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
