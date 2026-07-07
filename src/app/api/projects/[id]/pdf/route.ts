import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { ProjectService } from '@/lib/db/projectService';
import { ProjectPDF } from '@/components/pdf/ProjectPDF';
import { isAdminRequest } from '@/lib/adminAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get('lang') || 'es') as 'es' | 'en';

    // Get project with tabs from database
    const project = await ProjectService.getById(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Only generate PDF for published projects (admin can preview drafts)
    if (project.status !== 'published' && !isAdminRequest(request)) {
      return NextResponse.json(
        { error: 'Project is not published' },
        { status: 403 }
      );
    }

    // Debug: log project data
    console.log('[PDF API] Project:', project.title);
    console.log('[PDF API] Hero images:', project.heroImages);
    console.log('[PDF API] Project details HTML:', project.projectDetails);
    console.log('[PDF API] Tabs count:', project.tabs?.length);
    if (project.tabs) {
      project.tabs.forEach((tab, i) => {
        console.log(`[PDF API] Tab ${i}: "${tab.title}"`);
        console.log(`[PDF API] Tab ${i} hero images:`, tab.heroImages);
        console.log(`[PDF API] Tab ${i} projectDetails HTML:`, tab.projectDetails);
      });
    }

    // Generate PDF stream
    const stream = await renderToStream(
      ProjectPDF({ project, language })
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Generate filename: Tania-Candiani-(titulo).pdf
    const projectTitle = language === 'en' && project.title_en ? project.title_en : project.title;
    const sanitizedTitle = projectTitle.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s-]/g, '').replace(/\s+/g, '-');
    const filename = `Tania-Candiani-${sanitizedTitle}.pdf`;

    // Return PDF
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
