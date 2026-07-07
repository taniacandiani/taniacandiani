import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/db/projectService';
import { moveFolderInCloudinary } from '@/lib/cloudinary';
import { isAdminRequest } from '@/lib/adminAuth';
import { generateNewsExcerpt } from '@/lib/utils';
import type { Project } from '@/types';

// Caché en memoria (por instancia del servidor) para las respuestas públicas.
// El admin siempre lee directo de la base para ver sus cambios al instante.
let projectsCache: { data: Project[]; ts: number } | null = null;
const PROJECTS_CACHE_TTL = 60 * 1000;

function invalidateProjectsCache() {
  projectsCache = null;
}

async function getAllProjectsCached(isAdmin: boolean): Promise<Project[]> {
  if (!isAdmin && projectsCache && Date.now() - projectsCache.ts < PROJECTS_CACHE_TTL) {
    return projectsCache.data;
  }
  const projects = await ProjectService.getAll();
  projectsCache = { data: projects, ts: Date.now() };
  return projects;
}

// Versión ligera para listados: sin tabs ni HTML pesado, con extracto
// precalculado para las tarjetas. Reduce el payload de ~1.3MB a ~200KB.
function toSummary(project: Project) {
  const {
    tabs,
    projectDetails,
    projectDetails_en,
    technicalSheet,
    technicalSheet_en,
    credits,
    credits_en,
    heroImageDescriptions,
    heroImageDescriptions_en,
    ...rest
  } = project as any;

  return {
    ...rest,
    heroImages: project.heroImages?.slice(0, 1) || [],
    excerpt: generateNewsExcerpt(projectDetails || project.description || '', 200),
    excerpt_en: generateNewsExcerpt(projectDetails_en || (project as any).description_en || '', 200),
  };
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = isAdminRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const heroOnly = searchParams.get('hero') === 'true';
    const summary = searchParams.get('summary') === 'true';

    // Un solo proyecto por slug (para la página de detalle)
    if (slug) {
      const project = await ProjectService.getBySlug(slug);

      // Los borradores/archivados solo son visibles para el admin con sesión iniciada
      if (!project || (project.status !== 'published' && !isAdmin)) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      return NextResponse.json(project);
    }

    // Solo los proyectos del carrusel de la home (payload mínimo)
    if (heroOnly) {
      const heroProjects = await ProjectService.getHeroProjects();
      return NextResponse.json(heroProjects);
    }

    const projects = await getAllProjectsCached(isAdmin);

    // Los borradores/archivados solo son visibles para el admin con sesión iniciada
    const visible = isAdmin ? projects : projects.filter(p => p.status === 'published');

    return NextResponse.json(summary ? visible.map(toSummary) : visible);
  } catch (error) {
    console.error('Error reading projects data:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectData = await request.json();

    console.log('=== POST /api/projects ===');
    console.log('Received projectData:', JSON.stringify(projectData, null, 2));
    console.log('Categories:', projectData.categories);
    console.log('ShowInHomeHero:', projectData.showInHomeHero);
    console.log('Tabs count:', projectData.tabs?.length || 0);

    // Generate slug if not provided
    if (!projectData.slug && projectData.title) {
      projectData.slug = projectData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    }

    // Validate that slug is unique
    const existingProjectWithSlug = await ProjectService.getBySlug(projectData.slug);
    if (existingProjectWithSlug) {
      return NextResponse.json({
        error: 'A project with this slug already exists',
        slug: projectData.slug
      }, { status: 400 });
    }

    // Remove id if provided (create generates its own)
    const { id, ...projectDataWithoutId } = projectData;

    // Move temporary folders to permanent folders in Cloudinary
    // Check if any image URLs contain temp folders
    const tempFolderPattern = /proyectos\/temp-\d+/;
    let tempFolder: string | null = null;

    // Helper function to update URLs in an object
    const updateUrls = (obj: any, urlMap: { [oldUrl: string]: string }) => {
      if (!obj) return obj;

      if (typeof obj === 'string') {
        // If it's a URL string, replace it
        return urlMap[obj] || obj;
      }

      if (Array.isArray(obj)) {
        // If it's an array, recursively update each item
        return obj.map(item => updateUrls(item, urlMap));
      }

      if (typeof obj === 'object') {
        // If it's an object, recursively update each property
        const updated: any = {};
        for (const key in obj) {
          updated[key] = updateUrls(obj[key], urlMap);
        }
        return updated;
      }

      return obj;
    };

    // Detect temp folder from any image URL
    const detectTempFolder = (value: any): void => {
      if (typeof value === 'string' && tempFolderPattern.test(value)) {
        const match = value.match(tempFolderPattern);
        if (match && !tempFolder) {
          tempFolder = match[0];
        }
      } else if (Array.isArray(value)) {
        value.forEach(detectTempFolder);
      } else if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(detectTempFolder);
      }
    };

    detectTempFolder(projectDataWithoutId);

    // If temp folder found, move images to permanent folder
    if (tempFolder) {
      console.log(`Detected temp folder: ${tempFolder}`);
      const permanentFolder = `proyectos/${projectDataWithoutId.slug}`;
      console.log(`Moving to permanent folder: ${permanentFolder}`);

      try {
        const urlMap = await moveFolderInCloudinary(tempFolder, permanentFolder);
        console.log(`Moved ${Object.keys(urlMap).length} images`);

        // Update all URLs in the project data
        projectDataWithoutId.heroImages = updateUrls(projectDataWithoutId.heroImages, urlMap);
        projectDataWithoutId.image = updateUrls(projectDataWithoutId.image, urlMap);
        projectDataWithoutId.additionalImage = updateUrls(projectDataWithoutId.additionalImage, urlMap);

        // Update URLs in tabs if they exist
        if (projectDataWithoutId.tabs && Array.isArray(projectDataWithoutId.tabs)) {
          projectDataWithoutId.tabs = projectDataWithoutId.tabs.map((tab: any) => ({
            ...tab,
            heroImages: updateUrls(tab.heroImages, urlMap),
            additionalImage: updateUrls(tab.additionalImage, urlMap)
          }));
        }

        console.log('Updated project data with new URLs');
      } catch (error) {
        console.error('Error moving folder in Cloudinary:', error);
        // Continue anyway - images are still accessible from temp folder
      }
    }

    console.log('About to call ProjectService.create with:', {
      title: projectDataWithoutId.title,
      categoriesCount: projectDataWithoutId.categories?.length,
      showInHomeHero: projectDataWithoutId.showInHomeHero,
      hasHeroImages: !!projectDataWithoutId.heroImages?.length
    });

    const project = await ProjectService.create(projectDataWithoutId);
    invalidateProjectsCache();

    console.log('Project created successfully:', project.id);
    // Retornar el proyecto completo para que el frontend pueda usarlo
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error writing projects data - Full error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectData = await request.json();

    if (!projectData.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Move temporary folders to permanent folders in Cloudinary (for edits)
    const tempFolderPattern = /proyectos\/temp-\d+/;
    let tempFolder: string | null = null;

    // Helper function to update URLs in an object
    const updateUrls = (obj: any, urlMap: { [oldUrl: string]: string }) => {
      if (!obj) return obj;

      if (typeof obj === 'string') {
        return urlMap[obj] || obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(item => updateUrls(item, urlMap));
      }

      if (typeof obj === 'object') {
        const updated: any = {};
        for (const key in obj) {
          updated[key] = updateUrls(obj[key], urlMap);
        }
        return updated;
      }

      return obj;
    };

    // Detect temp folder from any image URL
    const detectTempFolder = (value: any): void => {
      if (typeof value === 'string' && tempFolderPattern.test(value)) {
        const match = value.match(tempFolderPattern);
        if (match && !tempFolder) {
          tempFolder = match[0];
        }
      } else if (Array.isArray(value)) {
        value.forEach(detectTempFolder);
      } else if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(detectTempFolder);
      }
    };

    detectTempFolder(projectData);

    // If temp folder found, move images to permanent folder
    if (tempFolder && projectData.slug) {
      console.log(`[UPDATE] Detected temp folder: ${tempFolder}`);
      const permanentFolder = `proyectos/${projectData.slug}`;
      console.log(`[UPDATE] Moving to permanent folder: ${permanentFolder}`);

      try {
        const urlMap = await moveFolderInCloudinary(tempFolder, permanentFolder);
        console.log(`[UPDATE] Moved ${Object.keys(urlMap).length} images`);

        // Update all URLs in the project data
        projectData.heroImages = updateUrls(projectData.heroImages, urlMap);
        projectData.image = updateUrls(projectData.image, urlMap);
        projectData.additionalImage = updateUrls(projectData.additionalImage, urlMap);

        // Update URLs in tabs if they exist
        if (projectData.tabs && Array.isArray(projectData.tabs)) {
          projectData.tabs = projectData.tabs.map((tab: any) => ({
            ...tab,
            heroImages: updateUrls(tab.heroImages, urlMap),
            additionalImage: updateUrls(tab.additionalImage, urlMap)
          }));
        }

        console.log('[UPDATE] Updated project data with new URLs');
      } catch (error) {
        console.error('[UPDATE] Error moving folder in Cloudinary:', error);
        // Continue anyway - images are still accessible from temp folder
      }
    }

    const project = await ProjectService.update(projectData.id, projectData);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    invalidateProjectsCache();
    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Error updating projects data:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const deleted = await ProjectService.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    invalidateProjectsCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting projects data:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
