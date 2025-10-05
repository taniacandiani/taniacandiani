import { NextRequest, NextResponse } from 'next/server';
import { NewsService } from '@/lib/db/newsService';

export async function GET() {
  try {
    const news = await NewsService.getAll();
    return NextResponse.json(news);
  } catch (error) {
    console.error('Error reading news data:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newsData = await request.json();

    // Validate that slug is unique
    const existingNewsWithSlug = await NewsService.getBySlug(newsData.slug);
    if (existingNewsWithSlug) {
      return NextResponse.json({
        error: 'A news item with this slug already exists',
        slug: newsData.slug
      }, { status: 400 });
    }

    const newsItem = await NewsService.create(newsData);

    return NextResponse.json({ success: true, id: newsItem.id, slug: newsItem.slug });
  } catch (error) {
    console.error('Error writing news data:', error);
    return NextResponse.json({ error: 'Failed to save news' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const newsData = await request.json();

    if (!newsData.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const newsItem = await NewsService.update(newsData.id, newsData);

    if (!newsItem) {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, newsItem });
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

    const deleted = await NewsService.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting news data:', error);
    return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
  }
}
