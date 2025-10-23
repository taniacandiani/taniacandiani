import { NextRequest, NextResponse } from 'next/server';
import { ExhibitionCategoryService } from '@/lib/db/exhibitionCategoryService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await ExhibitionCategoryService.getById(params.id);

    if (!category) {
      return NextResponse.json(
        { error: 'Exhibition category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching exhibition category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exhibition category' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryData = await request.json();

    console.log('=== PUT /api/exhibitions/categories/' + params.id + ' ===');
    console.log('Received categoryData:', categoryData);

    const category = await ExhibitionCategoryService.update(params.id, categoryData);

    if (!category) {
      return NextResponse.json(
        { error: 'Exhibition category not found' },
        { status: 404 }
      );
    }

    console.log('Updated category:', category);

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating exhibition category:', error);
    return NextResponse.json(
      { error: 'Failed to update exhibition category', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await ExhibitionCategoryService.delete(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Exhibition category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exhibition category:', error);
    return NextResponse.json(
      { error: 'Failed to delete exhibition category' },
      { status: 500 }
    );
  }
}