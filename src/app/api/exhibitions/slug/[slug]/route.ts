import { NextRequest, NextResponse } from 'next/server';
import { ExhibitionService } from '@/lib/db/exhibitionService';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const exhibition = await ExhibitionService.getBySlug(params.slug);

    if (!exhibition) {
      return NextResponse.json(
        { error: 'Exhibition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(exhibition);
  } catch (error) {
    console.error('Error fetching exhibition by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exhibition' },
      { status: 500 }
    );
  }
}