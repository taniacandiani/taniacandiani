import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/db/projectService';

export async function GET() {
  try {
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

    const project = await ProjectService.create(projectData);

    return NextResponse.json({ success: true, id: project.id, slug: project.slug });
  } catch (error) {
    console.error('Error writing projects data:', error);
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const projectData = await request.json();

    if (!projectData.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
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
