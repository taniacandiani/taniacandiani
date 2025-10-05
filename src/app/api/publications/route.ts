import { NextRequest, NextResponse } from 'next/server';
import { PublicationService } from '@/lib/db/publicationService';

export async function GET() {
  try {
    const publications = await PublicationService.getAll();
    return NextResponse.json(publications);
  } catch (error) {
    console.error('Error reading publications:', error);
    return NextResponse.json({ error: 'Failed to fetch publications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const publicationData = await request.json();

    const publication = await PublicationService.create(publicationData);

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
    const publicationData = await request.json();

    if (!publicationData.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const publication = await PublicationService.update(publicationData.id, publicationData);

    if (!publication) {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      );
    }

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

    const deleted = await PublicationService.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting publication:', error);
    return NextResponse.json(
      { error: 'Failed to delete publication' },
      { status: 500 }
    );
  }
}
