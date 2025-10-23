import { NextResponse } from 'next/server';
import { ExhibitionCategoryService } from '@/lib/db/exhibitionCategoryService';

export async function POST() {
  try {
    const updatedCategories = await ExhibitionCategoryService.updateCounts();
    return NextResponse.json(updatedCategories);
  } catch (error) {
    console.error('Error updating exhibition category counts:', error);
    return NextResponse.json(
      { error: 'Failed to update exhibition category counts' },
      { status: 500 }
    );
  }
}