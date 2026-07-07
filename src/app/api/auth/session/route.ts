import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';

// Indica si la petición trae la sesión de admin. La cookie es httpOnly,
// por lo que el frontend no puede leerla directamente y necesita este
// endpoint para saber si debe mostrar el menú de admin en el nav.
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { isAdmin: isAdminRequest(request) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
