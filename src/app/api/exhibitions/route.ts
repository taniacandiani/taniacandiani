import { NextRequest, NextResponse } from 'next/server';
import { ExhibitionService } from '@/lib/db/exhibitionService';
import { isAdminRequest } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');
    const includeAll = searchParams.get('includeAll') === 'true';

    let exhibitions;

    if (includeAll && isAdminRequest(request)) {
      // For admin: get all exhibitions including drafts
      exhibitions = await ExhibitionService.getAllIncludingDrafts();
    } else if (category) {
      // Get exhibitions by category
      exhibitions = await ExhibitionService.getByCategory(category);
    } else {
      // Get published exhibitions
      exhibitions = await ExhibitionService.getAll();
    }

    // Apply limit if specified
    if (limit) {
      exhibitions = exhibitions.slice(0, parseInt(limit, 10));
    }

    return NextResponse.json(exhibitions);
  } catch (error) {
    console.error('Error fetching exhibitions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exhibitions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exhibitionData = await request.json();

    console.log('=== POST /api/exhibitions ===');
    console.log('Received exhibitionData:', exhibitionData);

    const exhibition = await ExhibitionService.create(exhibitionData);

    console.log('Created exhibition:', exhibition);

    return NextResponse.json(exhibition);
  } catch (error) {
    console.error('Error creating exhibition:', error);
    return NextResponse.json(
      { error: 'Failed to create exhibition', details: error.message },
      { status: 500 }
    );
  }
}