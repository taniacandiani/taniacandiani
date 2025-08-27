import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'news-categories.json');

export async function GET() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const categories = JSON.parse(data);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error reading news categories data:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const category = await request.json();
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const categories = JSON.parse(data);
    
    // Generate ID if not provided
    if (!category.id) {
      category.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Add timestamp if not provided
    if (!category.createdAt) {
      category.createdAt = new Date().toISOString();
    }
    
    // Validate that name is unique
    const existingCategory = categories.find((item: any) => 
      item.name.toLowerCase() === category.name.toLowerCase()
    );
    if (existingCategory) {
      return NextResponse.json({ 
        error: 'A category with this name already exists',
        name: category.name 
      }, { status: 400 });
    }
    
    // Validate that ID is unique
    const existingCategoryWithId = categories.find((item: any) => item.id === category.id);
    if (existingCategoryWithId) {
      return NextResponse.json({ 
        error: 'A category with this ID already exists',
        id: category.id 
      }, { status: 400 });
    }
    
    categories.push(category);
    
    fs.writeFileSync(dataFilePath, JSON.stringify(categories, null, 2));
    
    return NextResponse.json({ success: true, id: category.id, name: category.name });
  } catch (error) {
    console.error('Error writing news categories data:', error);
    return NextResponse.json({ error: 'Failed to save category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const category = await request.json();
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const categories = JSON.parse(data);
    
    const index = categories.findIndex((item: any) => item.id === category.id);
    if (index !== -1) {
      // Validate that name is unique (excluding current category)
      const existingCategory = categories.find((item: any, i: number) => 
        i !== index && item.name.toLowerCase() === category.name.toLowerCase()
      );
      if (existingCategory) {
        return NextResponse.json({ 
          error: 'A category with this name already exists',
          name: category.name 
        }, { status: 400 });
      }
      
      categories[index] = { ...categories[index], ...category };
      fs.writeFileSync(dataFilePath, JSON.stringify(categories, null, 2));
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
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
    
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const categories = JSON.parse(data);
    
    const filteredCategories = categories.filter((item: any) => item.id !== id);
    
    if (filteredCategories.length === categories.length) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(filteredCategories, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting news categories data:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
