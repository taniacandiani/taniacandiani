import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/db/projectService';
import { moveFolderInCloudinary } from '@/lib/cloudinary';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeAll = searchParams.get('includeAll') === 'true';

    // For now, ProjectService.getAll() returns all projects regardless of status
    // This is fine for admin, but we could add a filter later if needed
    const projects = await ProjectService.getAll();

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error reading projects data:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    console.log('Project created successfully:', project.id);
    return NextResponse.json({ success: true, id: project.id, slug: project.slug });
  } catch (error) {
    console.error('Error writing projects data - Full error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
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

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Error updating projects data:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const deleted = await ProjectService.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting projects data:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
