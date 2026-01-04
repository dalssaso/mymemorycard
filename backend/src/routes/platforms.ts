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
  requireAuth(async (_req, _user) => {
    try {
      const platforms = await queryMany<Platform>(
        `SELECT 
          id, name, display_name, platform_type, is_system, is_physical,
          website_url, color_primary, default_icon_url, sort_order
        FROM platforms 
        ORDER BY is_system DESC, sort_order ASC, display_name ASC`
      )

      return new Response(JSON.stringify({ platforms }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Get platforms error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)

router.post(
  '/api/platforms',
  requireAuth(async (req) => {
    try {
      const body = (await req.json()) as {
        displayName?: string
        platformType?: string
        websiteUrl?: string
        defaultIconUrl?: string
        colorPrimary?: string
      }

      // Validation
      if (!body.displayName?.trim()) {
        return new Response(JSON.stringify({ error: 'displayName is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      if (
        !body.platformType ||
        !['pc', 'console', 'mobile', 'physical'].includes(body.platformType)
      ) {
        return new Response(
          JSON.stringify({ error: 'platformType must be one of: pc, console, mobile, physical' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders() },
          }
        )
      }

      // Validate SVG icon URL if provided
      if (body.defaultIconUrl) {
        const iconUrl = body.defaultIconUrl.trim()
        if (!iconUrl.toLowerCase().endsWith('.svg') && !iconUrl.startsWith('data:image/svg+xml')) {
          return new Response(
            JSON.stringify({ error: 'Icon URL must be an SVG file (ending in .svg or data URI)' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders() },
            }
          )
        }
      }

      const displayName = body.displayName.trim()
      const name = toPlatformSlug(displayName)

      if (!name) {
        return new Response(JSON.stringify({ error: 'Invalid displayName' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const platformType = body.platformType
      const websiteUrl = body.websiteUrl?.trim() || null
      const defaultIconUrl = body.defaultIconUrl?.trim() || null
      const colorPrimary = body.colorPrimary?.trim() || '#6B7280' // Default neutral gray
      const isPhysical = platformType === 'physical'

      const platform = await queryOne<Platform>(
        `INSERT INTO platforms (name, display_name, platform_type, is_system, is_physical, 
                                website_url, color_primary, default_icon_url, sort_order)
         VALUES ($1, $2, $3, false, $4, $5, $6, $7, 999)
         ON CONFLICT (name)
         DO UPDATE SET display_name = EXCLUDED.display_name, 
                       platform_type = EXCLUDED.platform_type,
                       website_url = EXCLUDED.website_url,
                       color_primary = EXCLUDED.color_primary,
                       default_icon_url = EXCLUDED.default_icon_url
         RETURNING id, name, display_name, platform_type, is_system, is_physical,
                   website_url, color_primary, default_icon_url, sort_order`,
        [name, displayName, platformType, isPhysical, websiteUrl, colorPrimary, defaultIconUrl]
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
