import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CONTACT_FILE = path.join(process.cwd(), 'src/data/contact.json');

export async function GET() {
  try {
    const fileContent = await fs.readFile(CONTACT_FILE, 'utf-8');
    const contactContent = JSON.parse(fileContent);
    return NextResponse.json(contactContent);
  } catch (error) {
    console.error('Error reading contact content:', error);
    return NextResponse.json(null, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contactContent = await request.json();
    
    // Guardar en archivo
    await fs.writeFile(CONTACT_FILE, JSON.stringify(contactContent, null, 2));
    
    return NextResponse.json({ success: true, contactContent });
  } catch (error) {
    console.error('Error saving contact content:', error);
    return NextResponse.json(
      { error: 'Failed to save contact content' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const contactContent = await request.json();
    
    // Guardar en archivo
    await fs.writeFile(CONTACT_FILE, JSON.stringify(contactContent, null, 2));
    
    return NextResponse.json({ success: true, contactContent });
  } catch (error) {
    console.error('Error updating contact content:', error);
    return NextResponse.json(
      { error: 'Failed to update contact content' },
      { status: 500 }
    );
  }
}
