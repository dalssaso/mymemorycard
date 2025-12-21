import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'
import type { Platform } from '@/types'

// Get all platforms
router.get(
  '/api/platforms',
  requireAuth(async (req, user) => {
    try {
      const platforms = await queryMany<Platform>(
        'SELECT id, name, display_name, platform_type FROM platforms ORDER BY display_name'
      )

      return new Response(
        JSON.stringify({ platforms }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get platforms error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)
