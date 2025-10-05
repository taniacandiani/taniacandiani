import { NextResponse } from 'next/server';
import { NewsCategoryService } from '@/lib/db/categoryService';

export async function POST() {
  try {
    await NewsCategoryService.updateCounts();
    return NextResponse.json({ success: true, message: 'News category counts updated' });
  } catch (error) {
    console.error('Error updating news category counts:', error);
    return NextResponse.json({ error: 'Failed to update counts' }, { status: 500 });
  }
}
