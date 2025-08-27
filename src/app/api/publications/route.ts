import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PUBLICATIONS_FILE = path.join(process.cwd(), 'src/data/publications.json');

export async function GET() {
  try {
    const fileContent = await fs.readFile(PUBLICATIONS_FILE, 'utf-8');
    const publications = JSON.parse(fileContent);
    return NextResponse.json(publications);
  } catch (error) {
    console.error('Error reading publications:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const publication = await request.json();
    
    // Leer publicaciones existentes
    let publications = [];
    try {
      const fileContent = await fs.readFile(PUBLICATIONS_FILE, 'utf-8');
      publications = JSON.parse(fileContent);
    } catch (error) {
      // Si el archivo no existe, crear uno vacío
      publications = [];
    }
    
    // Agregar nueva publicación
    publications.push(publication);
    
    // Guardar en archivo
    await fs.writeFile(PUBLICATIONS_FILE, JSON.stringify(publications, null, 2));
    
    return NextResponse.json({ success: true, publication });
  } catch (error) {
    console.error('Error creating publication:', error);
    return NextResponse.json(
      { error: 'Failed to create publication' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const publication = await request.json();
    
    // Leer publicaciones existentes
    const fileContent = await fs.readFile(PUBLICATIONS_FILE, 'utf-8');
    let publications = JSON.parse(fileContent);
    
    // Encontrar y actualizar la publicación
    const index = publications.findIndex((p: any) => p.id === publication.id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      );
    }
    
    publications[index] = publication;
    
    // Guardar en archivo
    await fs.writeFile(PUBLICATIONS_FILE, JSON.stringify(publications, null, 2));
    
    return NextResponse.json({ success: true, publication });
  } catch (error) {
    console.error('Error updating publication:', error);
    return NextResponse.json(
      { error: 'Failed to update publication' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Publication ID is required' },
        { status: 400 }
      );
    }
    
    // Leer publicaciones existentes
    const fileContent = await fs.readFile(PUBLICATIONS_FILE, 'utf-8');
    let publications = JSON.parse(fileContent);
    
    // Filtrar la publicación a eliminar
    const filteredPublications = publications.filter((p: any) => p.id !== id);
    
    if (filteredPublications.length === publications.length) {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      );
    }
    
    // Guardar en archivo
    await fs.writeFile(PUBLICATIONS_FILE, JSON.stringify(filteredPublications, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting publication:', error);
    return NextResponse.json(
      { error: 'Failed to delete publication' },
      { status: 500 }
    );
  }
}
