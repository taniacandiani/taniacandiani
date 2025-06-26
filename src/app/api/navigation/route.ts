import { NextRequest, NextResponse } from 'next/server'
import { 
  getNavigationData, 
  updateNavigationData, 
  addNavigationLink, 
  deleteNavigationLink, 
  updateNavigationLink,
  initDatabase 
} from '@/lib/database'

// Initialize database on first request
let dbInitialized = false

export async function GET() {
  if (!dbInitialized) {
    await initDatabase()
    dbInitialized = true
  }

  try {
    const data = await getNavigationData()
    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('GET /api/navigation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch navigation data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!dbInitialized) {
    await initDatabase()
    dbInitialized = true
  }

  try {
    const body = await request.json()
    const { action, ...data } = body
    let result = null

    switch (action) {
      case 'updateOrder':
        // Update link order
        result = await updateNavigationData(data.navId, { links: data.links })
        break

      case 'addLink':
        // Add new link
        const newLink = {
          id: `link-${Date.now()}`,
          label: data.label,
          url: data.url,
          openInNewTab: data.openInNewTab || false,
          order: 0, // Will be reordered
        }
        result = await addNavigationLink(data.navId, newLink)
        break

      case 'deleteLink':
        // Delete link
        result = await deleteNavigationLink(data.navId, data.linkId)
        break

      case 'updateLink':
        // Update existing link
        result = await updateNavigationLink(data.navId, data.linkId, data.updates)
        break

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    if (result === null) {
      return NextResponse.json({ success: false, error: 'Database operation failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Navigation updated successfully'
    })
  } catch (error) {
    console.error('POST /api/navigation error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update navigation' }, { status: 500 })
  }
} 