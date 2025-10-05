import { NextResponse } from 'next/server';
import { ProjectCategoryService } from '@/lib/db/categoryService';

export async function POST() {
  try {
    await ProjectCategoryService.updateCounts();
    return NextResponse.json({ success: true, message: 'Category counts updated' });
  } catch (error) {
    console.error('Error updating category counts:', error);
    return NextResponse.json({ error: 'Failed to update counts' }, { status: 500 });
  }
}
