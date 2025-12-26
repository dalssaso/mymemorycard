import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { query, queryOne } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'

interface UserPreferences {
  default_view: 'grid' | 'table'
  items_per_page: number
  theme: string
}

router.get(
  '/api/preferences',
  requireAuth(async (req, user) => {
    try {
      const prefs = await queryOne<UserPreferences>(
        `SELECT default_view, items_per_page, theme 
         FROM user_preferences 
         WHERE user_id = $1`,
        [user.id]
      )

      const defaultPrefs: UserPreferences = {
        default_view: 'grid',
        items_per_page: 25,
        theme: 'dark',
      }

      return new Response(
        JSON.stringify({ preferences: prefs || defaultPrefs }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get preferences error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

router.put(
  '/api/preferences',
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as Partial<UserPreferences>
      const { default_view, items_per_page, theme } = body

      if (default_view && !['grid', 'table'].includes(default_view)) {
        return new Response(
          JSON.stringify({ error: 'default_view must be "grid" or "table"' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (items_per_page && ![10, 25, 50, 100].includes(items_per_page)) {
        return new Response(
          JSON.stringify({ error: 'items_per_page must be 10, 25, 50, or 100' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      await query(
        `INSERT INTO user_preferences (user_id, default_view, items_per_page, theme, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET
           default_view = COALESCE($2, user_preferences.default_view),
           items_per_page = COALESCE($3, user_preferences.items_per_page),
           theme = COALESCE($4, user_preferences.theme),
           updated_at = NOW()`,
        [user.id, default_view || 'grid', items_per_page || 25, theme || 'dark']
      )

      const updated = await queryOne<UserPreferences>(
        `SELECT default_view, items_per_page, theme 
         FROM user_preferences 
         WHERE user_id = $1`,
        [user.id]
      )

      return new Response(
        JSON.stringify({ preferences: updated }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Update preferences error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)
