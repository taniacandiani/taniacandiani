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
  type: 'image' | 'document';
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

    // Determinar el tipo de archivo de forma más robusta
    const publicIdLower = resource.public_id?.toLowerCase() || '';
    const urlLower = resource.secure_url?.toLowerCase() || '';

    // Verificar si es PDF por múltiples criterios
    const isPdf = resource.format === 'pdf' ||
                  publicIdLower.endsWith('.pdf') ||
                  publicIdLower.endsWith('pdf') ||
                  publicIdLower.includes('pdf/') ||
                  urlLower.includes('.pdf') ||
                  urlLower.includes('/raw/');

    // Si no tiene formato definido, intentar deducirlo
    let fileFormat = resource.format;
    if (!fileFormat && isPdf) {
      fileFormat = 'pdf';
    } else if (!fileFormat) {
      // Intentar obtener la extensión del public_id o URL
      const extensionMatch = resource.public_id?.match(/\.([^.]+)$/);
      if (extensionMatch) {
        fileFormat = extensionMatch[1];
      }
    }

    folder.files.push({
      name: `${fileName}${fileFormat ? '.' + fileFormat : ''}`,
      path: resource.secure_url,
      type: isPdf ? 'document' : 'image',
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
    const imageResult = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      max_results: 500, // Ajustar según necesidad
      prefix: '', // Obtener todas las imágenes
    });

    // Obtener todos los PDFs de Cloudinary
    let rawResult = { resources: [] };
    try {
      rawResult = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'raw',
        max_results: 500, // Ajustar según necesidad
        prefix: '', // Obtener todos los archivos raw
      });
    } catch (error) {
      console.error('Error fetching raw resources:', error);
      // Continuar con solo las imágenes si falla la obtención de recursos raw
    }

    // Procesar todos los recursos raw y determinar si son PDFs
    const processedRawResources = rawResult.resources.map((r: any) => {
      // Si no tiene formato pero tiene .pdf en el public_id, marcarlo como PDF
      if (!r.format && r.public_id) {
        const publicIdLower = r.public_id.toLowerCase();
        if (publicIdLower.includes('.pdf') || publicIdLower.endsWith('pdf')) {
          r.format = 'pdf';
        }
      }
      return r;
    });

    // Combinar imágenes y archivos raw (que incluyen PDFs)
    const allResources = [
      ...imageResult.resources,
      ...processedRawResources
    ];

    console.log('Image resources found:', imageResult.resources.length);
    console.log('Raw resources found:', rawResult.resources.length);
    console.log('Raw resources details:', processedRawResources.map((r: any) => ({
      public_id: r.public_id,
      format: r.format,
      resource_type: r.resource_type
    })));

    const resources: CloudinaryResource[] = allResources.map((r: any) => ({
      public_id: r.public_id,
      secure_url: r.secure_url,
      format: r.format,
      width: r.width || 0,
      height: r.height || 0,
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
