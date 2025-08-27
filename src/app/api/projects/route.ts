import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'projects.json');

export async function GET() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const projects = JSON.parse(data);
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error reading projects data:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const project = await request.json();
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const projects = JSON.parse(data);
    
    // Generate ID if not provided
    if (!project.id) {
      project.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Generate slug if not provided
    if (!project.slug && project.title) {
      project.slug = project.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    }
    
    // Validate that ID is unique
    const existingProjectWithId = projects.find((item: any) => item.id === project.id);
    if (existingProjectWithId) {
      return NextResponse.json({ 
        error: 'A project with this ID already exists',
        id: project.id 
      }, { status: 400 });
    }
    
    // Validate that slug is unique
    const existingProjectWithSlug = projects.find((item: any) => item.slug === project.slug);
    if (existingProjectWithSlug) {
      return NextResponse.json({ 
        error: 'A project with this slug already exists',
        slug: project.slug 
      }, { status: 400 });
    }
    
    projects.push(project);
    
    fs.writeFileSync(dataFilePath, JSON.stringify(projects, null, 2));
    
    return NextResponse.json({ success: true, id: project.id, slug: project.slug });
  } catch (error) {
    console.error('Error writing projects data:', error);
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const project = await request.json();
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const projects = JSON.parse(data);
    
    const index = projects.findIndex((item: any) => item.id === project.id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...project };
      fs.writeFileSync(dataFilePath, JSON.stringify(projects, null, 2));
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
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
    
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const projects = JSON.parse(data);
    
    const filteredProjects = projects.filter((item: any) => item.id !== id);
    
    if (filteredProjects.length === projects.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(filteredProjects, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting projects data:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
