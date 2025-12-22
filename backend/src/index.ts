import { router } from '@/lib/router';
import { handleCors, corsHeaders } from '@/middleware/cors';

// Import routes
import '@/routes/auth';
import '@/routes/import';
import '@/routes/platforms';
import '@/routes/games';
import '@/routes/api-stats';
import '@/routes/admin';

const PORT = process.env.PORT || 3000;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Handle CORS preflight
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    console.log(`${req.method} ${url.pathname}`);

    // Match route
    const match = router.match(url.pathname, req.method);

    if (match) {
      try {
        const response = await match.route.handler(req, match.params);
        
        // Add CORS headers to response
        const headers = new Headers(response.headers);
        const cors = corsHeaders(req.headers.get('Origin') || undefined);
        Object.entries(cors).forEach(([key, value]) => {
          headers.set(key, value);
        });

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch (error) {
        console.error('Route handler error:', error instanceof Error ? error.message : 'Unknown error');
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders() } 
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      { 
        status: 404, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders() } 
      }
    );
  },
});

console.log(`Server running on http://localhost:${server.port}`);
