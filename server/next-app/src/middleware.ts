import { NextResponse, type NextRequest } from 'next/server';

const configuredAllowedOrigins = (process.env.APP_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultAllowedOrigins = new Set([
  'https://web-drawing-two.vercel.app',
  'https://web-drawing-carsh0712-gmailcoms-projects.vercel.app',
  'https://web-drawing-git-main-carsh0712-gmailcoms-projects.vercel.app',
  'https://web-drawing-hv3yq19kj-carsh0712-gmailcoms-projects.vercel.app',
  'https://web-drawing-bbcm78ho9-carsh0712-gmailcoms-projects.vercel.app',
]);

const allowedOrigins = new Set([...defaultAllowedOrigins, ...configuredAllowedOrigins]);
const vercelPreviewOriginPattern = /^https:\/\/web-drawing(?:-[a-z0-9-]+)?-carsh0712-gmailcoms-projects\.vercel\.app$/;

const isAllowedOrigin = (origin: string | null) => {
  if (!origin) {
    return false;
  }

  return allowedOrigins.has(origin) || vercelPreviewOriginPattern.test(origin);
};

const applyCorsHeaders = (response: NextResponse, request: NextRequest) => {
  const origin = request.headers.get('origin');

  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
  }

  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  return response;
};

export function middleware(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }), request);
  }

  return applyCorsHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: '/api/:path*',
};
