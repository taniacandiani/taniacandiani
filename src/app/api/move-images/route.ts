import { NextRequest, NextResponse } from 'next/server';
// NOTE: moveProjectImages was moved to server-side cloudinary.ts
// This endpoint is deprecated and should not be used
// import { moveProjectImages } from '@/lib/cloudinaryUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrls, tempFolder, finalFolder } = body;

    if (!imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json(
        { error: 'imageUrls debe ser un array' },
        { status: 400 }
      );
    }

    if (!tempFolder || !finalFolder) {
      return NextResponse.json(
        { error: 'tempFolder y finalFolder son requeridos' },
        { status: 400 }
      );
    }

    // DEPRECATED: This endpoint is no longer in use
    // Move images from temp folder to final folder
    // const newUrls = await moveProjectImages(imageUrls, tempFolder, finalFolder);
    return NextResponse.json(
      { error: 'Este endpoint está deprecado. Las imágenes se manejan directamente desde el admin.' },
      { status: 410 }
    );
  } catch (error: any) {
    console.error('Error in deprecated endpoint:', error);
    return NextResponse.json(
      {
        error: 'Este endpoint está deprecado.',
        details: error.message
      },
      { status: 410 }
    );
  }
}
