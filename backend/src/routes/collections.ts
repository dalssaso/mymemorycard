import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { query, queryOne, queryMany } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'

interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: Date
}

// Get all collections for the user
router.get(
  '/api/collections',
  requireAuth(async (req, user) => {
    try {
      const collections = await queryMany<Collection>(
        `SELECT id, name, description, created_at
         FROM collections
         WHERE user_id = $1
         ORDER BY name ASC`,
        [user.id]
      )

      // Get game counts for each collection
      const collectionsWithCounts = await Promise.all(
        collections.map(async (collection) => {
          const countResult = await queryOne<{ count: number }>(
            'SELECT COUNT(*) as count FROM collection_games WHERE collection_id = $1',
            [collection.id]
          )
          return {
            ...collection,
            game_count: countResult?.count || 0,
          }
        })
      )

      return new Response(
        JSON.stringify({ collections: collectionsWithCounts }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get collections error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Get games in a specific collection
router.get(
  '/api/collections/:id/games',
  requireAuth(async (req, user, params) => {
    try {
      const collectionId = params?.id
      if (!collectionId) {
        return new Response(
          JSON.stringify({ error: 'Collection ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify user owns this collection
      const collection = await queryOne<Collection>(
        'SELECT * FROM collections WHERE id = $1 AND user_id = $2',
        [collectionId, user.id]
      )

      if (!collection) {
        return new Response(
          JSON.stringify({ error: 'Collection not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const games = await queryMany(
        `SELECT 
          g.*,
          p.id as platform_id,
          p.display_name as platform_display_name,
          ugp.status,
          ugp.user_rating,
          ugp.is_favorite
         FROM games g
         INNER JOIN collection_games cg ON g.id = cg.game_id
         LEFT JOIN user_games ug ON g.id = ug.game_id AND ug.user_id = $1
         LEFT JOIN platforms p ON ug.platform_id = p.id
         LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ug.platform_id = ugp.platform_id AND ugp.user_id = $1
         WHERE cg.collection_id = $2
         ORDER BY g.name ASC`,
        [user.id, collectionId]
      )

      return new Response(
        JSON.stringify({ collection, games }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get collection games error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Create a new collection
router.post(
  '/api/collections',
  requireAuth(async (req, user) => {
    try {
      const body = await req.json() as { name?: string; description?: string }
      const { name, description } = body

      if (!name || !name.trim()) {
        return new Response(
          JSON.stringify({ error: 'Collection name is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const result = await query<Collection>(
        `INSERT INTO collections (user_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [user.id, name.trim(), description?.trim() || null]
      )

      return new Response(
        JSON.stringify({ collection: result.rows[0] }),
        { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Create collection error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Update a collection
router.put(
  '/api/collections/:id',
  requireAuth(async (req, user, params) => {
    try {
      const collectionId = params?.id
      const body = await req.json() as { name?: string; description?: string }
      const { name, description } = body

      if (!collectionId) {
        return new Response(
          JSON.stringify({ error: 'Collection ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (!name || !name.trim()) {
        return new Response(
          JSON.stringify({ error: 'Collection name is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify ownership
      const existing = await queryOne(
        'SELECT 1 FROM collections WHERE id = $1 AND user_id = $2',
        [collectionId, user.id]
      )

      if (!existing) {
        return new Response(
          JSON.stringify({ error: 'Collection not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const result = await query<Collection>(
        `UPDATE collections 
         SET name = $1, description = $2
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [name.trim(), description?.trim() || null, collectionId, user.id]
      )

      return new Response(
        JSON.stringify({ collection: result.rows[0] }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Update collection error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Delete a collection
router.delete(
  '/api/collections/:id',
  requireAuth(async (req, user, params) => {
    try {
      const collectionId = params?.id
      if (!collectionId) {
        return new Response(
          JSON.stringify({ error: 'Collection ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify ownership
      const existing = await queryOne(
        'SELECT 1 FROM collections WHERE id = $1 AND user_id = $2',
        [collectionId, user.id]
      )

      if (!existing) {
        return new Response(
          JSON.stringify({ error: 'Collection not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      await query(
        'DELETE FROM collections WHERE id = $1 AND user_id = $2',
        [collectionId, user.id]
      )

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Delete collection error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Add game to collection
router.post(
  '/api/collections/:id/games',
  requireAuth(async (req, user, params) => {
    try {
      const collectionId = params?.id
      const body = await req.json() as { game_id?: string }
      const { game_id } = body

      if (!collectionId || !game_id) {
        return new Response(
          JSON.stringify({ error: 'Collection ID and game ID are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify ownership
      const collection = await queryOne(
        'SELECT 1 FROM collections WHERE id = $1 AND user_id = $2',
        [collectionId, user.id]
      )

      if (!collection) {
        return new Response(
          JSON.stringify({ error: 'Collection not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Add game to collection (ignore if already exists)
      await query(
        `INSERT INTO collection_games (collection_id, game_id)
         VALUES ($1, $2)
         ON CONFLICT (collection_id, game_id) DO NOTHING`,
        [collectionId, game_id]
      )

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Add game to collection error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Remove game from collection
router.delete(
  '/api/collections/:id/games/:gameId',
  requireAuth(async (req, user, params) => {
    try {
      const collectionId = params?.id
      const gameId = params?.gameId

      if (!collectionId || !gameId) {
        return new Response(
          JSON.stringify({ error: 'Collection ID and game ID are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify ownership
      const collection = await queryOne(
        'SELECT 1 FROM collections WHERE id = $1 AND user_id = $2',
        [collectionId, user.id]
      )

      if (!collection) {
        return new Response(
          JSON.stringify({ error: 'Collection not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      await query(
        'DELETE FROM collection_games WHERE collection_id = $1 AND game_id = $2',
        [collectionId, gameId]
      )

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Remove game from collection error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Get game series (auto-collections based on series_name)
router.get(
  '/api/collections/series',
  requireAuth(async (req, user) => {
    try {
      const series = await queryMany<{ series_name: string; count: number }>(
        `SELECT g.series_name, COUNT(DISTINCT g.id) as count
         FROM games g
         INNER JOIN user_games ug ON g.id = ug.game_id
         WHERE ug.user_id = $1 AND g.series_name IS NOT NULL
         GROUP BY g.series_name
         HAVING COUNT(DISTINCT g.id) > 1
         ORDER BY count DESC, g.series_name ASC`,
        [user.id]
      )

      return new Response(
        JSON.stringify({ series }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get series error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Get games in a series
router.get(
  '/api/collections/series/:seriesName/games',
  requireAuth(async (req, user, params) => {
    try {
      const seriesName = params?.seriesName
      if (!seriesName) {
        return new Response(
          JSON.stringify({ error: 'Series name is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const games = await queryMany(
        `SELECT 
          g.*,
          p.id as platform_id,
          p.display_name as platform_display_name,
          ugp.status,
          ugp.user_rating,
          ugp.is_favorite
         FROM games g
         INNER JOIN user_games ug ON g.id = ug.game_id
         LEFT JOIN platforms p ON ug.platform_id = p.id
         LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ug.platform_id = ugp.platform_id AND ugp.user_id = $1
         WHERE ug.user_id = $1 AND g.series_name = $2
         ORDER BY g.release_date ASC NULLS LAST, g.name ASC`,
        [user.id, decodeURIComponent(seriesName)]
      )

      return new Response(
        JSON.stringify({ series_name: seriesName, games }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get series games error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)
