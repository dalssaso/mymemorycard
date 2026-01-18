/**
 * Steam Web API types for game library and achievements
 */

/**
 * Steam player summary from GetPlayerSummaries
 */
export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  personastate: number;
  communityvisibilitystate: number;
  profilestate?: number;
  lastlogoff?: number;
  commentpermission?: number;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  gameid?: string;
  gameserverip?: string;
  gameextrainfo?: string;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
}

/**
 * Steam owned game from GetOwnedGames
 */
export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  playtime_2weeks?: number;
  img_icon_url: string;
  has_community_visible_stats?: boolean;
  content_descriptorids?: number[];
  playtime_disconnected: number;
}

/**
 * Steam achievement from GetPlayerAchievements
 */
export interface SteamPlayerAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
  name?: string;
  description?: string;
}

/**
 * Steam achievement schema from GetSchemaForGame
 */
export interface SteamAchievementSchema {
  name: string;
  defaultvalue: number;
  displayName: string;
  hidden: number;
  description: string;
  icon: string;
  icongray: string;
}

/**
 * Steam global achievement percentages
 */
export interface SteamGlobalAchievementPercentage {
  name: string;
  percent: number;
}

/**
 * Steam credentials stored in user_api_credentials
 */
export interface SteamCredentials {
  steam_id: string;
  display_name: string;
  avatar_url: string;
  profile_url: string;
  linked_at: string;
}

/**
 * Steam library import result
 */
export interface SteamLibraryImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ appid: number; name: string; error: string }>;
}

/**
 * Steam achievement sync result
 */
export interface SteamAchievementSyncResult {
  synced: number;
  unlocked: number;
  total: number;
}

/**
 * Normalized achievement for storage
 */
export interface NormalizedAchievement {
  achievement_id: string;
  name: string;
  description: string;
  icon_url: string;
  rarity_percentage: number | null;
  unlocked: boolean;
  unlock_time: Date | null;
}
