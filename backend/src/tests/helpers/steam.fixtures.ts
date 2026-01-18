import type {
  NormalizedAchievement,
  SteamCredentials,
  SteamOwnedGame,
  SteamPlayerSummary,
} from "@/integrations/steam/steam.types";

/**
 * Steam player summary fixture.
 */
export const STEAM_PLAYER_SUMMARY_FIXTURE: SteamPlayerSummary = {
  steamid: "76561198012345678",
  personaname: "TestPlayer",
  profileurl: "https://steamcommunity.com/id/testplayer/",
  avatar: "https://avatars.steamstatic.com/test_avatar.jpg",
  avatarmedium: "https://avatars.steamstatic.com/test_avatar_medium.jpg",
  avatarfull: "https://avatars.steamstatic.com/test_avatar_full.jpg",
  personastate: 1,
  communityvisibilitystate: 3,
  profilestate: 1,
  lastlogoff: 1705500000,
  timecreated: 1300000000,
};

/**
 * Steam owned game fixture.
 */
export const STEAM_OWNED_GAME_FIXTURE: SteamOwnedGame = {
  appid: 730,
  name: "Counter-Strike 2",
  playtime_forever: 1200,
  playtime_2weeks: 60,
  img_icon_url: "8dbc71957312bbd3baea65848b545be9ad5f5a7c",
  has_community_visible_stats: true,
  playtime_disconnected: 0,
};

/**
 * Steam credentials fixture.
 */
export const STEAM_CREDENTIALS_FIXTURE: SteamCredentials = {
  steam_id: "76561198012345678",
  display_name: "TestPlayer",
  avatar_url: "https://avatars.steamstatic.com/test_avatar_full.jpg",
  profile_url: "https://steamcommunity.com/id/testplayer/",
  linked_at: "2026-01-18T12:00:00.000Z",
};

/**
 * Steam achievement fixture.
 */
export const STEAM_ACHIEVEMENT_FIXTURE: NormalizedAchievement = {
  achievement_id: "ACH_WIN_ROUNDS",
  name: "Win Rounds",
  description: "Win 100 rounds in competitive mode",
  icon_url:
    "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/730/achievement_icon.jpg",
  rarity_percentage: 45.2,
  unlocked: true,
  unlock_time: new Date("2026-01-15T10:30:00.000Z"),
};

/**
 * Create Steam player summary with overrides.
 *
 * @param overrides - Partial overrides to apply to the base fixture
 * @returns New SteamPlayerSummary with overrides applied
 */
export function createSteamPlayerSummaryFixture(
  overrides?: Partial<SteamPlayerSummary>
): SteamPlayerSummary {
  return { ...STEAM_PLAYER_SUMMARY_FIXTURE, ...overrides };
}

/**
 * Create Steam owned game with overrides.
 *
 * @param overrides - Partial overrides to apply to the base fixture
 * @returns New SteamOwnedGame with overrides applied
 */
export function createSteamOwnedGameFixture(overrides?: Partial<SteamOwnedGame>): SteamOwnedGame {
  return { ...STEAM_OWNED_GAME_FIXTURE, ...overrides };
}

/**
 * Create Steam credentials with overrides.
 *
 * @param overrides - Partial overrides to apply to the base fixture
 * @returns New SteamCredentials with overrides applied
 */
export function createSteamCredentialsFixture(
  overrides?: Partial<SteamCredentials>
): SteamCredentials {
  return { ...STEAM_CREDENTIALS_FIXTURE, ...overrides };
}

/**
 * Create normalized achievement with overrides.
 *
 * @param overrides - Partial overrides to apply to the base fixture
 * @returns New NormalizedAchievement with overrides applied
 */
export function createSteamAchievementFixture(
  overrides?: Partial<NormalizedAchievement>
): NormalizedAchievement {
  return { ...STEAM_ACHIEVEMENT_FIXTURE, ...overrides };
}
