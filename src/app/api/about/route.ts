import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const ABOUT_FILE = path.join(process.cwd(), 'src/data/about.json');

export async function GET() {
  try {
    const fileContent = await fs.readFile(ABOUT_FILE, 'utf-8');
    const aboutContent = JSON.parse(fileContent);
    return NextResponse.json(aboutContent);
  } catch (error) {
    console.error('Error reading about content:', error);
    return NextResponse.json(null, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const aboutContent = await request.json();
    
    // Guardar en archivo
    await fs.writeFile(ABOUT_FILE, JSON.stringify(aboutContent, null, 2));
    
    return NextResponse.json({ success: true, aboutContent });
  } catch (error) {
    console.error('Error saving about content:', error);
    return NextResponse.json(
      { error: 'Failed to save about content' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const aboutContent = await request.json();
    
    // Guardar en archivo
    await fs.writeFile(ABOUT_FILE, JSON.stringify(aboutContent, null, 2));
    
    return NextResponse.json({ success: true, aboutContent });
  } catch (error) {
    console.error('Error updating about content:', error);
    return NextResponse.json(
      { error: 'Failed to update about content' },
      { status: 500 }
    );
  }
}
