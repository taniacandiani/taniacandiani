import { NextRequest, NextResponse } from 'next/server';
import { ExhibitionService } from '@/lib/db/exhibitionService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exhibition = await ExhibitionService.getById(params.id);

    if (!exhibition) {
      return NextResponse.json(
        { error: 'Exhibition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(exhibition);
  } catch (error) {
    console.error('Error fetching exhibition:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exhibition' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exhibitionData = await request.json();

    console.log('=== PUT /api/exhibitions/' + params.id + ' ===');
    console.log('Received exhibitionData:', exhibitionData);

    const exhibition = await ExhibitionService.update(params.id, exhibitionData);

    if (!exhibition) {
      return NextResponse.json(
        { error: 'Exhibition not found' },
        { status: 404 }
      );
    }

    console.log('Updated exhibition:', exhibition);

    return NextResponse.json(exhibition);
  } catch (error) {
    console.error('Error updating exhibition:', error);
    return NextResponse.json(
      { error: 'Failed to update exhibition', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await ExhibitionService.delete(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Exhibition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exhibition:', error);
    return NextResponse.json(
      { error: 'Failed to delete exhibition' },
      { status: 500 }
    );
  }
}