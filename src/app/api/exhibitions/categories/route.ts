import { NextRequest, NextResponse } from 'next/server';
import { ExhibitionCategoryService } from '@/lib/db/exhibitionCategoryService';

export async function GET() {
  try {
    const categories = await ExhibitionCategoryService.getAll();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching exhibition categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exhibition categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const categoryData = await request.json();

    console.log('=== POST /api/exhibitions/categories ===');
    console.log('Received categoryData:', categoryData);

    const category = await ExhibitionCategoryService.create(categoryData);

    console.log('Created category:', category);

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating exhibition category:', error);
    return NextResponse.json(
      { error: 'Failed to create exhibition category', details: error.message },
      { status: 500 }
    );
  }
}