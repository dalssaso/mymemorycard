import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { corsHeaders } from '@/middleware/cors'
import { query, queryMany, queryOne } from '@/services/db'

interface UserPlatformRow {
  id: string
  platform_id: string
  username: string | null
  icon_url: string | null
  profile_url: string | null
  notes: string | null
  created_at: string
  name: string
  display_name: string
  platform_type: string
  color_primary: string
  default_icon_url: string | null
}

router.get(
  '/api/user-platforms',
  requireAuth(async (req, user) => {
    try {
      const platforms = await queryMany<UserPlatformRow>(
        `SELECT
          up.id,
          up.platform_id,
          up.username,
          up.icon_url,
          up.profile_url,
          up.notes,
          up.created_at,
          p.name,
          p.display_name,
          p.platform_type,
          p.color_primary,
          p.default_icon_url
        FROM user_platforms up
        INNER JOIN platforms p ON p.id = up.platform_id
        WHERE up.user_id = $1
        ORDER BY p.is_system DESC, p.sort_order ASC, p.display_name ASC`,
        [user.id]
      )

      return new Response(JSON.stringify({ platforms }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Get user platforms error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)

router.get(
  '/api/user-platforms/:id',
  requireAuth(async (req, user, params) => {
    try {
      const id = params?.id

      if (!id) {
        return new Response(JSON.stringify({ error: 'User platform id is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const platform = await queryOne<UserPlatformRow>(
        `SELECT
          up.id,
          up.platform_id,
          up.username,
          up.icon_url,
          up.profile_url,
          up.notes,
          up.created_at,
          p.name,
          p.display_name,
          p.platform_type,
          p.color_primary,
          p.default_icon_url
        FROM user_platforms up
        INNER JOIN platforms p ON p.id = up.platform_id
        WHERE up.user_id = $1 AND up.id = $2`,
        [user.id, id]
      )

      if (!platform) {
        return new Response(JSON.stringify({ error: 'User platform not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      return new Response(JSON.stringify({ platform }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Get user platform error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)

router.post(
  '/api/user-platforms',
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as {
        platformId?: string
        username?: string
        iconUrl?: string
        profileUrl?: string
        notes?: string
      }

      if (!body.platformId) {
        return new Response(JSON.stringify({ error: 'platformId is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const platform = await queryOne<{ id: string }>('SELECT id FROM platforms WHERE id = $1', [
        body.platformId,
      ])

      if (!platform) {
        return new Response(JSON.stringify({ error: 'Platform not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      await query(
        `INSERT INTO user_platforms (user_id, platform_id, username, icon_url, profile_url, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, platform_id) DO NOTHING`,
        [
          user.id,
          body.platformId,
          body.username || null,
          body.iconUrl || null,
          body.profileUrl || null,
          body.notes || null,
        ]
      )

      return new Response(null, {
        status: 204,
        headers: { ...corsHeaders() },
      })
    } catch (error) {
      console.error('Add user platform error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)

router.patch(
  '/api/user-platforms/:id',
  requireAuth(async (req, user, params) => {
    try {
      const id = params?.id

      if (!id) {
        return new Response(JSON.stringify({ error: 'User platform id is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const body = (await req.json()) as {
        username?: string | null
        iconUrl?: string | null
        profileUrl?: string | null
        notes?: string | null
      }

      if (
        !('username' in body) &&
        !('iconUrl' in body) &&
        !('profileUrl' in body) &&
        !('notes' in body)
      ) {
        return new Response(JSON.stringify({ error: 'No fields provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const existing = await queryOne<{
        username: string | null
        icon_url: string | null
        profile_url: string | null
        notes: string | null
      }>(
        `SELECT username, icon_url, profile_url, notes
         FROM user_platforms
         WHERE id = $1 AND user_id = $2`,
        [id, user.id]
      )

      if (!existing) {
        return new Response(JSON.stringify({ error: 'User platform not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const nextUsername = 'username' in body ? (body.username ?? null) : existing.username
      const nextIconUrl = 'iconUrl' in body ? (body.iconUrl ?? null) : existing.icon_url
      const nextProfileUrl = 'profileUrl' in body ? (body.profileUrl ?? null) : existing.profile_url
      const nextNotes = 'notes' in body ? (body.notes ?? null) : existing.notes

      await query(
        `UPDATE user_platforms
         SET username = $1, icon_url = $2, profile_url = $3, notes = $4
         WHERE id = $5 AND user_id = $6`,
        [nextUsername, nextIconUrl, nextProfileUrl, nextNotes, id, user.id]
      )

      return new Response(null, {
        status: 204,
        headers: { ...corsHeaders() },
      })
    } catch (error) {
      console.error('Update user platform error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)

router.delete(
  '/api/user-platforms/:id',
  requireAuth(async (req, user, params) => {
    try {
      const id = params?.id

      if (!id) {
        return new Response(JSON.stringify({ error: 'User platform id is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const deleted = await queryOne<{ id: string }>(
        `DELETE FROM user_platforms
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [id, user.id]
      )

      if (!deleted) {
        return new Response(JSON.stringify({ error: 'User platform not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      return new Response(null, {
        status: 204,
        headers: { ...corsHeaders() },
      })
    } catch (error) {
      console.error('Delete user platform error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)
