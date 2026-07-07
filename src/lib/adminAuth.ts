import { NextRequest } from 'next/server';

// La sesión de admin se crea en /api/auth/login como cookie httpOnly.
// El navegador la envía automáticamente en cada request same-origin,
// por lo que las rutas API pueden distinguir al admin del público.
export function isAdminRequest(request: NextRequest): boolean {
  return request.cookies.get('admin-session')?.value === 'authenticated';
}
