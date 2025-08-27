import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'news.json');

export async function GET() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const news = JSON.parse(data);
    return NextResponse.json(news);
  } catch (error) {
    console.error('Error reading news data:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newsItem = await request.json();
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const news = JSON.parse(data);
    
    // Generate ID if not provided
    if (!newsItem.id) {
      newsItem.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Add timestamp if not provided
    if (!newsItem.publishedAt) {
      newsItem.publishedAt = new Date().toISOString();
    }
    
    // Validate that slug is unique
    const existingNewsWithSlug = news.find((item: any) => item.slug === newsItem.slug);
    if (existingNewsWithSlug) {
      return NextResponse.json({ 
        error: 'A news item with this slug already exists',
        slug: newsItem.slug 
      }, { status: 400 });
    }
    
    // Validate that ID is unique
    const existingNewsWithId = news.find((item: any) => item.id === newsItem.id);
    if (existingNewsWithId) {
      return NextResponse.json({ 
        error: 'A news item with this ID already exists',
        id: newsItem.id 
      }, { status: 400 });
    }
    
    news.push(newsItem);
    
    fs.writeFileSync(dataFilePath, JSON.stringify(news, null, 2));
    
    return NextResponse.json({ success: true, id: newsItem.id, slug: newsItem.slug });
  } catch (error) {
    console.error('Error writing news data:', error);
    return NextResponse.json({ error: 'Failed to save news' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const newsItem = await request.json();
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const news = JSON.parse(data);
    
    const index = news.findIndex((item: any) => item.id === newsItem.id);
    if (index !== -1) {
      news[index] = { ...news[index], ...newsItem };
      fs.writeFileSync(dataFilePath, JSON.stringify(news, null, 2));
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating news data:', error);
    return NextResponse.json({ error: 'Failed to update news' }, { status: 500 });
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
    const news = JSON.parse(data);
    
    const filteredNews = news.filter((item: any) => item.id !== id);
    
    if (filteredNews.length === news.length) {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 });
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(filteredNews, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting news data:', error);
    return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
  }
}
