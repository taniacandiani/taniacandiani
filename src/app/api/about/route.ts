import { NextRequest, NextResponse } from 'next/server';
import { AboutService } from '@/lib/db/contentService';

export async function GET() {
  try {
    const aboutContent = await AboutService.get();
    return NextResponse.json(aboutContent);
  } catch (error) {
    console.error('Error reading about content:', error);
    return NextResponse.json({ error: 'Failed to fetch about content' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentData = await request.json();

    const aboutContent = await AboutService.update(contentData);

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
    const contentData = await request.json();

    const aboutContent = await AboutService.update(contentData);

    return NextResponse.json({ success: true, aboutContent });
  } catch (error) {
    console.error('Error updating about content:', error);
    return NextResponse.json(
      { error: 'Failed to update about content' },
      { status: 500 }
    );
  }
}
