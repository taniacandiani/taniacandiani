import { NextRequest, NextResponse } from 'next/server';
import { ProjectCategoryService } from '@/lib/db/categoryService';

export async function GET() {
  try {
    const categories = await ProjectCategoryService.getAll();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error reading categories data:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const categoryData = await request.json();

    const category = await ProjectCategoryService.create(categoryData);

    return NextResponse.json({ success: true, id: category.id, name: category.name });
  } catch (error) {
    console.error('Error writing categories data:', error);
    return NextResponse.json({ error: 'Failed to save category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const categoryData = await request.json();

    if (!categoryData.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const category = await ProjectCategoryService.update(categoryData.id, categoryData);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Error updating categories data:', error);
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

    const deleted = await ProjectCategoryService.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting categories data:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
