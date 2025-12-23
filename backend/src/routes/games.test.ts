import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { pool } from '@/services/db'

describe('Games Routes', () => {
  let token: string
  let userId: string
  let gameId: string
  let platformId: string

  beforeAll(async () => {
    // 1. Create a user
    // Try to register, if fails (exists), try to login
    let authRes = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'gamestest',
        email: 'gamestest@test.com',
        password: 'password123'
      })
    })

    if (authRes.status === 409) {
       authRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'gamestest@test.com',
          password: 'password123'
        })
      })
    }

    const authData = await authRes.json() as any
    token = authData.token
    
    // Get userId from DB
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', ['gamestest@test.com'])
    userId = userRes.rows[0].id

    // 2. Get a platform (assuming 'steam' exists from seed, or create one)
    let platformRes = await pool.query("SELECT id FROM platforms WHERE name = 'steam'")
    if (platformRes.rows.length === 0) {
      platformRes = await pool.query("INSERT INTO platforms (name, display_name, platform_type) VALUES ('steam', 'Steam', 'pc') RETURNING id")
    }
    platformId = platformRes.rows[0].id

    // 3. Create a game
    const gameRes = await pool.query("INSERT INTO games (name, rawg_id) VALUES ('Test Game', 12345) RETURNING id")
    gameId = gameRes.rows[0].id

    // 4. Add game to user library
    await pool.query("INSERT INTO user_games (user_id, game_id, platform_id, owned) VALUES ($1, $2, $3, true)", [userId, gameId, platformId])
  })

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM users WHERE email = $1', ['gamestest@test.com'])
    await pool.query('DELETE FROM games WHERE id = $1', [gameId])
    // user_games and user_game_progress cascade delete
  })

  describe('PATCH /api/games/:id/status', () => {
    it('should update game status', async () => {
      const response = await fetch(`http://localhost:3000/api/games/${gameId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform_id: platformId,
          status: 'playing'
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json() as any
      expect(data.success).toBe(true)

      // Verify in DB
      const res = await pool.query('SELECT status, started_at FROM user_game_progress WHERE user_id = $1 AND game_id = $2 AND platform_id = $3', [userId, gameId, platformId])
      expect(res.rows[0].status).toBe('playing')
      expect(res.rows[0].started_at).not.toBeNull()
    })

    it('should fail with invalid status', async () => {
      const response = await fetch(`http://localhost:3000/api/games/${gameId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform_id: platformId,
          status: 'invalid_status'
        })
      })
      expect(response.status).toBe(400)
    })

    it('should fail when user does not own game', async () => {
      const randomId = Math.floor(Math.random() * 1000000)
      const otherGameRes = await pool.query("INSERT INTO games (name, rawg_id) VALUES ('Not Owned Game', $1) ON CONFLICT DO NOTHING RETURNING id", [randomId])
      
      if (otherGameRes.rows.length === 0) {
        const existingGame = await pool.query("SELECT id FROM games WHERE rawg_id = $1", [randomId])
        const otherGameId = existingGame.rows[0].id
        
        const response = await fetch(`http://localhost:3000/api/games/${otherGameId}/status`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            platform_id: platformId,
            status: 'playing'
          })
        })

        expect(response.status).toBe(404)
        return
      }

      const otherGameId = otherGameRes.rows[0].id

      const response = await fetch(`http://localhost:3000/api/games/${otherGameId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform_id: platformId,
          status: 'playing'
        })
      })

      expect(response.status).toBe(404)
      const data = await response.json() as any
      expect(data.error).toContain('not found in your library')

      await pool.query('DELETE FROM games WHERE id = $1', [otherGameId])
    })
  })

  describe('PUT /api/games/:id/rating', () => {
    it('should update game rating', async () => {
      const response = await fetch(`http://localhost:3000/api/games/${gameId}/rating`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform_id: platformId,
          rating: 9
        })
      })

      expect(response.status).toBe(200)
      
      // Verify in DB
      const res = await pool.query('SELECT user_rating FROM user_game_progress WHERE user_id = $1 AND game_id = $2 AND platform_id = $3', [userId, gameId, platformId])
      expect(res.rows[0].user_rating).toBe(9)
    })

     it('should fail with invalid rating', async () => {
      const response = await fetch(`http://localhost:3000/api/games/${gameId}/rating`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform_id: platformId,
          rating: 11
        })
      })
      expect(response.status).toBe(400)
    })

    it('should fail when user does not own game', async () => {
      const randomId = Math.floor(Math.random() * 1000000) + 100000
      const otherGameRes = await pool.query("INSERT INTO games (name, rawg_id) VALUES ('Unowned Rating Game', $1) ON CONFLICT DO NOTHING RETURNING id", [randomId])
      
      if (otherGameRes.rows.length === 0) {
        const existingGame = await pool.query("SELECT id FROM games WHERE rawg_id = $1", [randomId])
        const otherGameId = existingGame.rows[0].id
        
        const response = await fetch(`http://localhost:3000/api/games/${otherGameId}/rating`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            platform_id: platformId,
            rating: 7
          })
        })

        expect(response.status).toBe(404)
        return
      }

      const otherGameId = otherGameRes.rows[0].id

      const response = await fetch(`http://localhost:3000/api/games/${otherGameId}/rating`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform_id: platformId,
          rating: 7
        })
      })

      expect(response.status).toBe(404)

      await pool.query('DELETE FROM games WHERE id = $1', [otherGameId])
    })
  })

  describe('POST /api/games/:id/notes', () => {
    it('should update game notes', async () => {
      const notes = 'Great game so far!'
      const response = await fetch(`http://localhost:3000/api/games/${gameId}/notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform_id: platformId,
          notes
        })
      })

      expect(response.status).toBe(200)
      
      // Verify in DB
      const res = await pool.query('SELECT notes FROM user_game_progress WHERE user_id = $1 AND game_id = $2 AND platform_id = $3', [userId, gameId, platformId])
      expect(res.rows[0].notes).toBe(notes)
    })
  })

  describe('PUT /api/games/:id/favorite', () => {
    it('should mark game as favorite', async () => {
      const response = await fetch(`http://localhost:3000/api/games/${gameId}/favorite`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform_id: platformId,
          is_favorite: true
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json() as any
      expect(data.success).toBe(true)
      expect(data.is_favorite).toBe(true)
      
      // Verify in DB
      const res = await pool.query('SELECT is_favorite FROM user_game_progress WHERE user_id = $1 AND game_id = $2 AND platform_id = $3', [userId, gameId, platformId])
      expect(res.rows[0].is_favorite).toBe(true)
    })

    it('should unmark game as favorite', async () => {
      const response = await fetch(`http://localhost:3000/api/games/${gameId}/favorite`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform_id: platformId,
          is_favorite: false
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json() as any
      expect(data.success).toBe(true)
      expect(data.is_favorite).toBe(false)
      
      // Verify in DB
      const res = await pool.query('SELECT is_favorite FROM user_game_progress WHERE user_id = $1 AND game_id = $2 AND platform_id = $3', [userId, gameId, platformId])
      expect(res.rows[0].is_favorite).toBe(false)
    })

    it('should fail when user does not own game', async () => {
      const randomId = Math.floor(Math.random() * 1000000) + 200000
      const otherGameRes = await pool.query("INSERT INTO games (name, rawg_id) VALUES ('Unowned Favorite Game', $1) ON CONFLICT DO NOTHING RETURNING id", [randomId])
      
      if (otherGameRes.rows.length === 0) {
        const existingGame = await pool.query("SELECT id FROM games WHERE rawg_id = $1", [randomId])
        const otherGameId = existingGame.rows[0].id
        
        const response = await fetch(`http://localhost:3000/api/games/${otherGameId}/favorite`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            platform_id: platformId,
            is_favorite: true
          })
        })

        expect(response.status).toBe(404)
        return
      }

      const otherGameId = otherGameRes.rows[0].id

      const response = await fetch(`http://localhost:3000/api/games/${otherGameId}/favorite`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform_id: platformId,
          is_favorite: true
        })
      })

      expect(response.status).toBe(404)

      await pool.query('DELETE FROM games WHERE id = $1', [otherGameId])
    })
  })

  describe('GET /api/games/:id/custom-fields', () => {
    it('should return empty object when no custom fields exist', async () => {
      const response = await fetch(`http://localhost:3000/api/games/${gameId}/custom-fields`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json() as any
      expect(data.customFields).toEqual({})
    })
  })

  describe('PUT /api/games/:id/custom-fields', () => {
    it('should create custom fields for a game', async () => {
      const customFields = {
        platform_id: platformId,
        estimated_completion_hours: 20,
        actual_playtime_hours: 15,
        completion_percentage: 75,
        difficulty_rating: 7,
        achievements_total: 50,
        achievements_earned: 35,
        replay_value: 4
      }

      const response = await fetch(`http://localhost:3000/api/games/${gameId}/custom-fields`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(customFields)
      })

      expect(response.status).toBe(200)
      const data = await response.json() as any
      expect(data.success).toBe(true)

      // Verify in DB
      const res = await pool.query(
        'SELECT * FROM user_game_custom_fields WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [userId, gameId, platformId]
      )
      expect(res.rows.length).toBe(1)
      expect(res.rows[0].difficulty_rating).toBe(7)
      expect(res.rows[0].completion_percentage).toBe(75)
    })

    it('should update existing custom fields', async () => {
      const updatedFields = {
        platform_id: platformId,
        difficulty_rating: 9,
        replay_value: 5
      }

      const response = await fetch(`http://localhost:3000/api/games/${gameId}/custom-fields`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      })

      expect(response.status).toBe(200)

      // Verify updated values
      const res = await pool.query(
        'SELECT difficulty_rating, replay_value FROM user_game_custom_fields WHERE user_id = $1 AND game_id = $2',
        [userId, gameId]
      )
      expect(res.rows[0].difficulty_rating).toBe(9)
      expect(res.rows[0].replay_value).toBe(5)
    })

    it('should fail with invalid difficulty rating', async () => {
      const response = await fetch(`http://localhost:3000/api/games/${gameId}/custom-fields`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform_id: platformId,
          difficulty_rating: 11
        })
      })

      expect(response.status).toBe(400)
    })

    it('should fail with invalid completion percentage', async () => {
      const response = await fetch(`http://localhost:3000/api/games/${gameId}/custom-fields`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform_id: platformId,
          completion_percentage: 150
        })
      })

      expect(response.status).toBe(400)
    })

    it('should fail when user does not own game', async () => {
      const randomId = Math.floor(Math.random() * 1000000) + 300000
      const otherGameRes = await pool.query("INSERT INTO games (name, rawg_id) VALUES ('Unowned Custom Fields Game', $1) ON CONFLICT DO NOTHING RETURNING id", [randomId])
      
      if (otherGameRes.rows.length === 0) {
        const existingGame = await pool.query("SELECT id FROM games WHERE rawg_id = $1", [randomId])
        const otherGameId = existingGame.rows[0].id
        
        const response = await fetch(`http://localhost:3000/api/games/${otherGameId}/custom-fields`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            platform_id: platformId,
            difficulty_rating: 5
          })
        })

        expect(response.status).toBe(404)
        return
      }

      const otherGameId = otherGameRes.rows[0].id

      const response = await fetch(`http://localhost:3000/api/games/${otherGameId}/custom-fields`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform_id: platformId,
          difficulty_rating: 5
        })
      })

      expect(response.status).toBe(404)

      await pool.query('DELETE FROM games WHERE id = $1', [otherGameId])
    })
  })
})
