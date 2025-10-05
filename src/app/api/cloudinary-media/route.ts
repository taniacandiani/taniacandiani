import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  folder: string;
}

interface MediaFile {
  name: string;
  path: string;
  type: 'image';
  size?: string;
  lastModified?: string;
  width?: number;
  height?: number;
}

interface MediaFolder {
  name: string;
  path: string;
  files: MediaFile[];
  subfolders: MediaFolder[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${Math.round(bytes / (1024 * 1024) * 10) / 10} MB`;
}

function organizeByFolders(resources: CloudinaryResource[]): MediaFolder[] {
  const folderMap = new Map<string, MediaFolder>();

  console.log('=== organizeByFolders ===');
  console.log('Total resources:', resources.length);

  // Crear estructura de carpetas
  resources.forEach(resource => {
    const parts = resource.public_id.split('/');
    const fileName = parts.pop() || resource.public_id;
    const folderPath = parts.length > 0 ? parts.join('/') : 'root';
    const folderName = parts[parts.length - 1] || 'root';

    console.log('Processing:', {
      public_id: resource.public_id,
      parts,
      fileName,
      folderPath,
      folderName
    });

    if (!folderMap.has(folderPath)) {
      folderMap.set(folderPath, {
        name: folderName,
        path: folderPath,
        files: [],
        subfolders: []
      });
    }

    const folder = folderMap.get(folderPath)!;
    folder.files.push({
      name: `${fileName}.${resource.format}`,
      path: resource.secure_url,
      type: 'image',
      size: formatFileSize(resource.bytes),
      lastModified: new Date(resource.created_at).toISOString().split('T')[0],
      width: resource.width,
      height: resource.height
    });
  });

  console.log('FolderMap keys:', Array.from(folderMap.keys()));

  // Organizar carpetas en jerarquía
  const rootFolders: MediaFolder[] = [];

  // First pass: identify all root-level folders (folders with only one level)
  const allPaths = Array.from(folderMap.keys()).sort();

  console.log('All paths sorted:', allPaths);

  // Build hierarchy from bottom up
  allPaths.forEach(path => {
    const parts = path.split('/');
    const folder = folderMap.get(path)!;

    if (parts.length === 1) {
      // This is a top-level folder
      rootFolders.push(folder);
      console.log('Added to root:', path);
    } else {
      // This is a nested folder - find its parent
      const parentPath = parts.slice(0, -1).join('/');
      const parentFolder = folderMap.get(parentPath);

      if (parentFolder) {
        // Check if not already added
        if (!parentFolder.subfolders.find(sf => sf.path === folder.path)) {
          parentFolder.subfolders.push(folder);
          console.log('Added to parent:', path, '-> parent:', parentPath);
        }
      } else {
        // Parent doesn't exist, this might be orphaned - add to root
        console.log('No parent found for:', path, '- adding to root');
        rootFolders.push(folder);
      }
    }
  });

  console.log('Root folders count:', rootFolders.length);
  console.log('Root folders:', rootFolders.map(f => ({ name: f.name, path: f.path, filesCount: f.files.length, subfoldersCount: f.subfolders.length })));

  return rootFolders;
}

export async function GET(request: NextRequest) {
  try {
    // Obtener todas las imágenes de Cloudinary
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      max_results: 500, // Ajustar según necesidad
      prefix: '', // Obtener todas las imágenes
    });

    const resources: CloudinaryResource[] = result.resources.map((r: any) => ({
      public_id: r.public_id,
      secure_url: r.secure_url,
      format: r.format,
      width: r.width,
      height: r.height,
      bytes: r.bytes,
      created_at: r.created_at,
      folder: r.folder || 'root'
    }));

    const structure = organizeByFolders(resources);

    return NextResponse.json({
      structure,
      total: resources.length,
      message: 'Imágenes de Cloudinary obtenidas correctamente'
    });
  } catch (error: any) {
    console.error('Error obteniendo imágenes de Cloudinary:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener imágenes de Cloudinary',
        details: error.message
      },
      { status: 500 }
    );
  }
}
