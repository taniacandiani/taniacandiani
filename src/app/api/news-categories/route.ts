import { NextRequest, NextResponse } from 'next/server';
import { NewsCategoryService } from '@/lib/db/categoryService';

export async function GET() {
  try {
    const categories = await NewsCategoryService.getAll();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error reading news categories data:', error);
    return NextResponse.json({ error: 'Failed to fetch news categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const categoryData = await request.json();

    const category = await NewsCategoryService.create(categoryData);

    return NextResponse.json({ success: true, id: category.id, name: category.name });
  } catch (error) {
    console.error('Error writing news categories data:', error);
    return NextResponse.json({ error: 'Failed to save category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const categoryData = await request.json();

    if (!categoryData.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const category = await NewsCategoryService.update(categoryData.id, categoryData);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Error updating news categories data:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const deleted = await NewsCategoryService.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting news categories data:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
