import { NextRequest, NextResponse } from 'next/server';
import { PublicationService } from '@/lib/db/publicationService';

export async function POST(request: NextRequest) {
  try {
    const { publications } = await request.json();

    if (!Array.isArray(publications)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Update display_order for each publication
    for (const pub of publications) {
      await PublicationService.updateOrder(pub.id, pub.displayOrder);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating publication order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
