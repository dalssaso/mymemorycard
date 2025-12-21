export function corsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.ORIGIN,
  ].filter(Boolean);

  const requestOrigin = origin || '';
  const allowOrigin = allowedOrigins.includes(requestOrigin) 
    ? requestOrigin 
    : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req.headers.get('Origin') || undefined),
    });
  }
  return null;
}
