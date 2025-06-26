import { NextRequest, NextResponse } from 'next/server'

// Basic API endpoints for Payload CMS
export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  
  // Mock responses for common endpoints
  if (slug.includes('navigation')) {
    return NextResponse.json({
      docs: [
        {
          id: '1',
          title: 'Footer Links',
          area: 'footer',
          links: [
            { label: 'About', url: '/about', openInNewTab: false, order: 1 },
            { label: 'Contact', url: '/contact', openInNewTab: false, order: 2 },
            { label: 'Privacy', url: '/privacy', openInNewTab: false, order: 3 },
          ],
          isActive: true,
        }
      ],
      totalDocs: 1,
      limit: 10,
      page: 1,
    })
  }
  
  if (slug.includes('users')) {
    return NextResponse.json({
      docs: [],
      totalDocs: 0,
      limit: 10,
      page: 1,
    })
  }
  
  return NextResponse.json({ message: `Payload API endpoint: ${slug}`, method: 'GET' })
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  const body = await req.json()
  
  return NextResponse.json({ 
    message: `Created new ${slug}`, 
    data: body,
    id: Math.random().toString(36).substr(2, 9)
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  const body = await req.json()
  
  return NextResponse.json({ 
    message: `Updated ${slug}`, 
    data: body 
  })
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  
  return NextResponse.json({ 
    message: `Deleted ${slug}` 
  })
} 