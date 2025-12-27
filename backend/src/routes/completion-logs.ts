import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany, query, queryOne } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'

type CompletionType = 'main' | 'dlc' | 'full' | 'completionist'

interface CompletionLog {
  id: string
  user_id: string
  game_id: string
  platform_id: string
  completion_type: CompletionType
  dlc_id: string | null
  percentage: number
  logged_at: string
  notes: string | null
}

interface CompletionLogWithGame extends CompletionLog {
  game_name: string
  platform_name: string
  dlc_name?: string
}

interface DLCSummary {
  dlcId: string
  name: string
  percentage: number
  weight: number
  requiredForFull: boolean
  owned?: boolean
}

interface CompletionSummary {
  main: number
  full: number
  completionist: number
  dlcs: DLCSummary[]
  achievementPercentage: number
  hasDlcs: boolean
}

interface GameAddition {
  id: string
  name: string
  weight: number
  required_for_full: boolean
  addition_type: string
  is_complete_edition: boolean
}

interface UserGameEdition {
  edition_id: string | null
}

async function getOwnedDlcIds(
  userId: string,
  gameId: string,
  platformId: string
): Promise<Set<string>> {
  const userEdition = await queryOne<UserGameEdition>(
    'SELECT edition_id FROM user_game_editions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
    [userId, gameId, platformId]
  )

  if (userEdition?.edition_id) {
    const edition = await queryOne<{ is_complete_edition: boolean }>(
      'SELECT is_complete_edition FROM game_additions WHERE id = $1',
      [userEdition.edition_id]
    )

    if (edition?.is_complete_edition) {
      const allDlcs = await queryMany<{ id: string }>(
        `SELECT id FROM game_additions WHERE game_id = $1 AND addition_type = 'dlc'`,
        [gameId]
      )
      return new Set(allDlcs.map((d) => d.id))
    }
  }

  const ownedDlcs = await queryMany<{ addition_id: string }>(
    'SELECT addition_id FROM user_game_additions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3 AND owned = true',
    [userId, gameId, platformId]
  )

  return new Set(ownedDlcs.map((d) => d.addition_id))
}

async function calculateDerivedProgress(
  userId: string,
  gameId: string,
  platformId: string
): Promise<{ full: number; completionist: number; main: number; achievementPercentage: number; hasDlcs: boolean }> {
  const mainResult = await queryOne<{ percentage: number }>(
    `SELECT percentage FROM completion_logs 
     WHERE user_id = $1 AND game_id = $2 AND platform_id = $3 AND completion_type = 'main'
     ORDER BY logged_at DESC LIMIT 1`,
    [userId, gameId, platformId]
  )
  const main = mainResult?.percentage || 0

  const allDlcs = await queryMany<GameAddition>(
    `SELECT id, name, weight, required_for_full, addition_type, is_complete_edition FROM game_additions 
     WHERE game_id = $1 AND addition_type = 'dlc' AND required_for_full = true`,
    [gameId]
  )

  const ownedDlcIds = await getOwnedDlcIds(userId, gameId, platformId)

  const ownedRequiredDlcs = allDlcs.filter((dlc) => ownedDlcIds.has(dlc.id))

  let weightedSum = main
  let totalWeight = 1

  for (const dlc of ownedRequiredDlcs) {
    const dlcProgress = await queryOne<{ percentage: number }>(
      `SELECT percentage FROM completion_logs 
       WHERE user_id = $1 AND game_id = $2 AND platform_id = $3 
         AND completion_type = 'dlc' AND dlc_id = $4
       ORDER BY logged_at DESC LIMIT 1`,
      [userId, gameId, platformId, dlc.id]
    )
    const dlcPct = dlcProgress?.percentage || 0
    weightedSum += dlcPct * dlc.weight
    totalWeight += dlc.weight
  }

  const full = totalWeight > 0 ? Math.floor(weightedSum / totalWeight) : main

  const achievementStats = await queryOne<{ total: number; completed: number }>(
    `SELECT 
       (SELECT COUNT(*) FROM game_rawg_achievements WHERE game_id = $1) as total,
       (SELECT COUNT(*) FROM user_rawg_achievements WHERE user_id = $2 AND game_id = $1 AND completed = true) as completed`,
    [gameId, userId]
  )

  const totalAch = achievementStats?.total || 0
  const completedAch = achievementStats?.completed || 0
  const achievementPercentage = totalAch > 0 ? Math.floor((completedAch / totalAch) * 100) : 100

  let completionist: number
  if (totalAch > 0) {
    completionist = Math.floor((full + achievementPercentage) / 2)
  } else {
    completionist = full
  }

  const hasDlcs = ownedRequiredDlcs.length > 0

  return { full, completionist, main, achievementPercentage, hasDlcs }
}

async function logDerivedProgress(
  userId: string,
  gameId: string,
  platformId: string,
  type: 'full' | 'completionist',
  percentage: number
): Promise<void> {
  const lastLog = await queryOne<{ percentage: number }>(
    `SELECT percentage FROM completion_logs 
     WHERE user_id = $1 AND game_id = $2 AND platform_id = $3 AND completion_type = $4
     ORDER BY logged_at DESC LIMIT 1`,
    [userId, gameId, platformId, type]
  )

  if (!lastLog || lastLog.percentage !== percentage) {
    await query(
      `INSERT INTO completion_logs (user_id, game_id, platform_id, completion_type, percentage, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, gameId, platformId, type, percentage, 'Auto-calculated']
    )
  }
}

async function updateGameStatus(
  userId: string,
  gameId: string,
  platformId: string,
  full: number,
  completionist: number,
  main: number
): Promise<{ statusChanged: boolean; newStatus: string | null }> {
  const progress = await queryOne<{ status: string }>(
    'SELECT status FROM user_game_progress WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
    [userId, gameId, platformId]
  )
  const currentStatus = progress?.status || 'backlog'

  let newStatus: string | null = null

  if (completionist === 100) {
    newStatus = 'completed'
  } else if (full === 100 && currentStatus !== 'completed') {
    newStatus = 'finished'
  } else if (currentStatus === 'backlog' && main > 0) {
    newStatus = 'playing'
  }

  if (newStatus && newStatus !== currentStatus) {
    await query(
      `INSERT INTO user_game_progress (user_id, game_id, platform_id, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, game_id, platform_id)
       DO UPDATE SET status = $4`,
      [userId, gameId, platformId, newStatus]
    )
    return { statusChanged: true, newStatus }
  }

  return { statusChanged: false, newStatus: null }
}

router.get(
  '/api/games/:gameId/completion-logs',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'Game ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = parseInt(url.searchParams.get('offset') || '0')
      const completionType = url.searchParams.get('type') as CompletionType | null
      const dlcId = url.searchParams.get('dlcId')
      const platformId = url.searchParams.get('platform_id')

      let logsQuery = `
        SELECT 
          cl.*,
          g.name as game_name,
          p.display_name as platform_name,
          ga.name as dlc_name
        FROM completion_logs cl
        INNER JOIN games g ON cl.game_id = g.id
        INNER JOIN platforms p ON cl.platform_id = p.id
        LEFT JOIN game_additions ga ON cl.dlc_id = ga.id
        WHERE cl.user_id = $1 AND cl.game_id = $2
      `
      const queryParams: (string | number)[] = [user.id, gameId]

      if (completionType) {
        queryParams.push(completionType)
        logsQuery += ` AND cl.completion_type = $${queryParams.length}`
      }

      if (dlcId) {
        queryParams.push(dlcId)
        logsQuery += ` AND cl.dlc_id = $${queryParams.length}`
      }

      logsQuery += ` ORDER BY cl.logged_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
      queryParams.push(limit, offset)

      const logs = await queryMany<CompletionLogWithGame>(logsQuery, queryParams)

      const totalResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM completion_logs WHERE user_id = $1 AND game_id = $2`,
        [user.id, gameId]
      )

      const mainPct = await queryOne<{ percentage: number }>(
        `SELECT percentage FROM completion_logs 
         WHERE user_id = $1 AND game_id = $2 AND completion_type = 'main'
         ORDER BY logged_at DESC LIMIT 1`,
        [user.id, gameId]
      )

      const additions = await queryMany<GameAddition & { id: string }>(
        `SELECT id, name, weight, required_for_full, addition_type, is_complete_edition 
         FROM game_additions WHERE game_id = $1 AND addition_type = 'dlc'`,
        [gameId]
      )

      const activePlatformId = platformId || logs[0]?.platform_id

      let ownedDlcIds: Set<string> = new Set()
      if (activePlatformId) {
        ownedDlcIds = await getOwnedDlcIds(user.id, gameId, activePlatformId)
      }

      const dlcSummaries: DLCSummary[] = []
      for (const dlc of additions) {
        const isOwned = ownedDlcIds.has(dlc.id)
        const dlcProgress = await queryOne<{ percentage: number }>(
          `SELECT percentage FROM completion_logs 
           WHERE user_id = $1 AND game_id = $2 AND completion_type = 'dlc' AND dlc_id = $3
           ORDER BY logged_at DESC LIMIT 1`,
          [user.id, gameId, dlc.id]
        )
        dlcSummaries.push({
          dlcId: dlc.id,
          name: dlc.name,
          percentage: dlcProgress?.percentage || 0,
          weight: dlc.weight,
          requiredForFull: dlc.required_for_full,
          owned: isOwned,
        })
      }

      let derived = { full: 0, completionist: 0, main: mainPct?.percentage || 0, achievementPercentage: 100, hasDlcs: false }

      if (activePlatformId) {
        derived = await calculateDerivedProgress(user.id, gameId, activePlatformId)
      }

      const ownedDlcs = dlcSummaries.filter((d) => d.owned)

      const summary: CompletionSummary = {
        main: derived.main,
        full: derived.full,
        completionist: derived.completionist,
        dlcs: dlcSummaries,
        achievementPercentage: derived.achievementPercentage,
        hasDlcs: ownedDlcs.length > 0,
      }

      return new Response(
        JSON.stringify({
          logs,
          total: totalResult?.count || 0,
          currentPercentage: summary.main,
          summary,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get completion logs error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

router.post(
  '/api/games/:gameId/completion-logs',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'Game ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const body = (await req.json()) as {
        platformId?: string
        percentage?: number
        completionType?: CompletionType
        dlcId?: string | null
        notes?: string | null
      }

      const { platformId, percentage, completionType = 'main', dlcId, notes } = body

      if (!platformId) {
        return new Response(
          JSON.stringify({ error: 'Platform ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (percentage === undefined || percentage === null) {
        return new Response(
          JSON.stringify({ error: 'Percentage is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (percentage < 0 || percentage > 100) {
        return new Response(
          JSON.stringify({ error: 'Percentage must be between 0 and 100' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (completionType === 'full' || completionType === 'completionist') {
        return new Response(
          JSON.stringify({ error: 'Full and completionist progress are auto-calculated' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (completionType === 'dlc' && !dlcId) {
        return new Response(
          JSON.stringify({ error: 'DLC ID is required for dlc completion type' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (completionType !== 'dlc' && dlcId) {
        return new Response(
          JSON.stringify({ error: 'DLC ID should only be provided for dlc completion type' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const validTypes: CompletionType[] = ['main', 'dlc']
      if (!validTypes.includes(completionType)) {
        return new Response(
          JSON.stringify({ error: 'Invalid completion type. Use main or dlc.' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const ownership = await queryOne<{ id: string }>(
        'SELECT id FROM user_games WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      if (!ownership) {
        return new Response(
          JSON.stringify({ error: 'Game not found in your library' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (dlcId) {
        const dlcExists = await queryOne<{ id: string }>(
          'SELECT id FROM game_additions WHERE id = $1 AND game_id = $2',
          [dlcId, gameId]
        )
        if (!dlcExists) {
          return new Response(
            JSON.stringify({ error: 'DLC not found for this game' }),
            { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
          )
        }
      }

      const log = await queryOne<CompletionLog>(
        `INSERT INTO completion_logs (user_id, game_id, platform_id, completion_type, dlc_id, percentage, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [user.id, gameId, platformId, completionType, dlcId || null, percentage, notes || null]
      )

      if (completionType === 'main') {
        await query(
          `INSERT INTO user_game_progress (user_id, game_id, platform_id, completion_percentage)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, game_id, platform_id)
           DO UPDATE SET completion_percentage = $4`,
          [user.id, gameId, platformId, percentage]
        )

        await query(
          `INSERT INTO user_game_custom_fields (user_id, game_id, platform_id, completion_percentage, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (user_id, game_id, platform_id)
           DO UPDATE SET completion_percentage = $4, updated_at = NOW()`,
          [user.id, gameId, platformId, percentage]
        )
      }

      const derived = await calculateDerivedProgress(user.id, gameId, platformId)

      await logDerivedProgress(user.id, gameId, platformId, 'full', derived.full)
      await logDerivedProgress(user.id, gameId, platformId, 'completionist', derived.completionist)

      const { statusChanged, newStatus } = await updateGameStatus(
        user.id,
        gameId,
        platformId,
        derived.full,
        derived.completionist,
        derived.main
      )

      return new Response(
        JSON.stringify({
          log,
          statusChanged,
          newStatus,
          derived: {
            full: derived.full,
            completionist: derived.completionist,
          },
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        }
      )
    } catch (error) {
      console.error('Create completion log error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

router.delete(
  '/api/games/:gameId/completion-logs/:logId',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      const logId = params?.logId

      if (!gameId || !logId) {
        return new Response(
          JSON.stringify({ error: 'Game ID and Log ID are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const existingLog = await queryOne<CompletionLog>(
        'SELECT * FROM completion_logs WHERE id = $1 AND user_id = $2 AND game_id = $3',
        [logId, user.id, gameId]
      )

      if (!existingLog) {
        return new Response(
          JSON.stringify({ error: 'Completion log not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      await query('DELETE FROM completion_logs WHERE id = $1 AND user_id = $2', [logId, user.id])

      const latestLog = await queryOne<CompletionLog>(
        `SELECT * FROM completion_logs 
         WHERE user_id = $1 AND game_id = $2 AND platform_id = $3 
           AND completion_type = $4 AND (dlc_id = $5 OR ($5 IS NULL AND dlc_id IS NULL))
         ORDER BY logged_at DESC
         LIMIT 1`,
        [user.id, gameId, existingLog.platform_id, existingLog.completion_type, existingLog.dlc_id]
      )

      const newPercentage = latestLog?.percentage || 0

      if (existingLog.completion_type === 'main') {
        await query(
          `UPDATE user_game_progress 
           SET completion_percentage = $1
           WHERE user_id = $2 AND game_id = $3 AND platform_id = $4`,
          [newPercentage, user.id, gameId, existingLog.platform_id]
        )

        await query(
          `UPDATE user_game_custom_fields 
           SET completion_percentage = $1, updated_at = NOW()
           WHERE user_id = $2 AND game_id = $3 AND platform_id = $4`,
          [newPercentage, user.id, gameId, existingLog.platform_id]
        )
      }

      const derived = await calculateDerivedProgress(user.id, gameId, existingLog.platform_id)
      await logDerivedProgress(user.id, gameId, existingLog.platform_id, 'full', derived.full)
      await logDerivedProgress(user.id, gameId, existingLog.platform_id, 'completionist', derived.completionist)

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Delete completion log error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

router.post(
  '/api/games/:gameId/completion-logs/recalculate',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'Game ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const body = (await req.json()) as { platformId?: string }
      const { platformId } = body

      if (!platformId) {
        return new Response(
          JSON.stringify({ error: 'Platform ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const derived = await calculateDerivedProgress(user.id, gameId, platformId)

      await logDerivedProgress(user.id, gameId, platformId, 'full', derived.full)
      await logDerivedProgress(user.id, gameId, platformId, 'completionist', derived.completionist)

      const { statusChanged, newStatus } = await updateGameStatus(
        user.id,
        gameId,
        platformId,
        derived.full,
        derived.completionist,
        derived.main
      )

      return new Response(
        JSON.stringify({
          success: true,
          derived,
          statusChanged,
          newStatus,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Recalculate progress error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)
