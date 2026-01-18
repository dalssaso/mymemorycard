/**
 * RetroAchievements API types
 */

/**
 * RetroAchievements user profile
 */
export interface RAUserProfile {
  user: string
  userPic: string
  memberSince: string
  richPresenceMsg: string
  lastGameID: number
  contribCount: number
  contribYield: number
  totalPoints: number
  totalSoftcorePoints: number
  totalTruePoints: number
  permissions: number
  untracked: boolean
  id: number
  userWallActive: boolean
  motto: string
}

/**
 * RetroAchievements game info
 */
export interface RAGameInfo {
  id: number
  title: string
  consoleID: number
  consoleName: string
  forumTopicID: number
  flags: number
  imageIcon: string
  imageTitle: string
  imageIngame: string
  imageBoxArt: string
  publisher: string
  developer: string
  genre: string
  released: string
  isFinal: boolean
  richPresencePatch: string
  numAchievements: number
  numDistinctPlayersCasual: number
  numDistinctPlayersHardcore: number
}

/**
 * RetroAchievements achievement
 */
export interface RAAchievement {
  id: number
  numAwarded: number
  numAwardedHardcore: number
  title: string
  description: string
  points: number
  trueRatio: number
  author: string
  dateModified: string
  dateCreated: string
  badgeName: string
  displayOrder: number
  memAddr: string
  type: string
}

/**
 * RetroAchievements user achievement
 */
export interface RAUserAchievement {
  id: number
  title: string
  description: string
  points: number
  badgeName: string
  dateEarned: string | null
  dateEarnedHardcore: string | null
  hardcoreAchieved: boolean
}

/**
 * RetroAchievements credentials stored in user_api_credentials
 */
export interface RACredentials {
  username: string
  api_key: string
}

/**
 * RetroAchievements sync result
 */
export interface RASyncResult {
  synced: number
  unlocked: number
  total: number
}
