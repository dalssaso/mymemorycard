import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany, queryOne } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'
import type { Platform } from '@/types'

function toPlatformSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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

router.post(
  '/api/platforms',
  requireAuth(async (req) => {
    try {
      const body = (await req.json()) as {
        displayName?: string
        platformType?: string | null
      }

      if (!body.displayName || body.displayName.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'displayName is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const displayName = body.displayName.trim()
      const name = toPlatformSlug(displayName)

      if (!name) {
        return new Response(JSON.stringify({ error: 'Invalid displayName' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const platformType = body.platformType?.trim() || null

      const platform = await queryOne<Platform>(
        `INSERT INTO platforms (name, display_name, platform_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (name)
         DO UPDATE SET display_name = EXCLUDED.display_name, platform_type = EXCLUDED.platform_type
         RETURNING id, name, display_name, platform_type`,
        [name, displayName, platformType]
      )

      if (!platform) {
        return new Response(JSON.stringify({ error: 'Failed to create platform' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      return new Response(JSON.stringify({ platform }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Create platform error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)
