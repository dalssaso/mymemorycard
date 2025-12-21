import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { getRAWGRequestStats } from '@/services/api-monitor'
import { corsHeaders } from '@/middleware/cors'

// Get API usage statistics
router.get(
  '/api/stats/rawg',
  requireAuth(async (req, user) => {
    try {
      const stats = await getRAWGRequestStats()

      return new Response(
        JSON.stringify(stats),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get RAWG stats error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)
