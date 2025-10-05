import { NextRequest, NextResponse } from 'next/server';
import { moveProjectImages } from '@/lib/cloudinaryUtils';

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

    // Move images from temp folder to final folder
    const newUrls = await moveProjectImages(imageUrls, tempFolder, finalFolder);

    return NextResponse.json({
      success: true,
      newUrls,
      message: `${newUrls.length} imágenes movidas exitosamente`
    });
  } catch (error: any) {
    console.error('Error moving images:', error);
    return NextResponse.json(
      {
        error: 'Error al mover las imágenes',
        details: error.message
      },
      { status: 500 }
    );
  }
}
