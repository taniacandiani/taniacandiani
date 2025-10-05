import { NextResponse } from 'next/server';
import { getNile } from '@/db/client';

export async function GET() {
  try {
    const nile = await getNile();

    // Test database connection
    const result = await nile.db.query('SELECT COUNT(*) as count FROM projects');
    const projectCount = result.rows[0].count;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      projectCount: parseInt(projectCount),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
