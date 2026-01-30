// Shared CORS headers for all Edge Functions

// Allowed origins - add your production domains here
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:3000',
  // Add your production domains below:
  'https://warehousepos.com',
  'https://www.warehousepos.com',
  'https://app.warehousepos.com',
  'https://pos.warehousepos.com',
  'https://portal.warehousepos.com',
  'https://admin.warehousepos.com',
  // Vercel deployments
  'https://warehouse-pos-zeta.vercel.app',
  'https://warehousepos.vercel.app',
  'https://warehouse-pos.vercel.app',
];

function getOrigin(req: Request): string {
  const origin = req.headers.get('origin') || '';
  // In production, only allow specific origins
  // In development/testing, be more permissive
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  // For Supabase dashboard testing or server-to-server calls
  if (!origin || origin === 'null') {
    return ALLOWED_ORIGINS[0];
  }
  // Default to first allowed origin (won't match, CORS will fail)
  console.warn(`CORS: Blocked origin: ${origin}`);
  return ALLOWED_ORIGINS[0];
}

export function getCorsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Legacy export for backward compatibility
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function handleCors(req: Request): Response | null {
  const headers = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }
  return null;
}

export function jsonResponse(data: object, status = 200, req?: Request): Response {
  const headers = req ? getCorsHeaders(req) : corsHeaders;
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(error: string, status = 400, details?: object, req?: Request): Response {
  return jsonResponse({ success: false, error, ...details }, status, req);
}

export function successResponse(data: object, req?: Request): Response {
  return jsonResponse({ success: true, ...data }, 200, req);
}
