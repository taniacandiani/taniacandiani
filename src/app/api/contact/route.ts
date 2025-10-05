import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/db/contentService';

export async function GET() {
  try {
    const contactContent = await ContactService.get();
    return NextResponse.json(contactContent);
  } catch (error) {
    console.error('Error reading contact content:', error);
    return NextResponse.json({ error: 'Failed to fetch contact content' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentData = await request.json();

    const contactContent = await ContactService.update(contentData);

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
    const contentData = await request.json();

    const contactContent = await ContactService.update(contentData);

    return NextResponse.json({ success: true, contactContent });
  } catch (error) {
    console.error('Error updating contact content:', error);
    return NextResponse.json(
      { error: 'Failed to update contact content' },
      { status: 500 }
    );
  }
}
