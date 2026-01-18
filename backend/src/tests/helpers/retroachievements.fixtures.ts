import type {
  RAAchievement,
  RACredentials,
  RAGameInfo,
  RASyncResult,
  RAUserAchievement,
  RAUserProfile,
} from "@/integrations/retroachievements/retroachievements.types";

/**
 * RetroAchievements user profile fixture.
 */
export const RA_USER_PROFILE_FIXTURE: RAUserProfile = {
  user: "TestRetroPlayer",
  userPic: "/UserPic/TestRetroPlayer.png",
  memberSince: "2020-01-15 10:30:00",
  richPresenceMsg: "Playing Super Mario World",
  lastGameID: 228,
  contribCount: 0,
  contribYield: 0,
  totalPoints: 5000,
  totalSoftcorePoints: 1000,
  totalTruePoints: 7500,
  permissions: 1,
  untracked: false,
  id: 12345,
  userWallActive: true,
  motto: "Retro gaming enthusiast",
};

/**
 * RetroAchievements game info fixture.
 */
export const RA_GAME_INFO_FIXTURE: RAGameInfo = {
  id: 228,
  title: "Super Mario World",
  consoleID: 3,
  consoleName: "SNES/Super Famicom",
  forumTopicID: 135,
  flags: 0,
  imageIcon: "/Images/068013.png",
  imageTitle: "/Images/000039.png",
  imageIngame: "/Images/000040.png",
  imageBoxArt: "/Images/051872.png",
  publisher: "Nintendo",
  developer: "Nintendo EAD",
  genre: "2D Platforming",
  released: "November 21, 1990",
  isFinal: true,
  richPresencePatch: "Display\nPlaying",
  numAchievements: 96,
  numDistinctPlayersCasual: 50000,
  numDistinctPlayersHardcore: 25000,
};

/**
 * RetroAchievements achievement fixture.
 */
export const RA_ACHIEVEMENT_FIXTURE: RAAchievement = {
  id: 1001,
  numAwarded: 30000,
  numAwardedHardcore: 15000,
  title: "First Star",
  description: "Collect your first Dragon Coin",
  points: 5,
  trueRatio: 6,
  author: "AchievementMaker",
  dateModified: "2023-06-15 12:00:00",
  dateCreated: "2020-03-10 08:30:00",
  badgeName: "00001",
  displayOrder: 1,
  memAddr: "0xabcd==1",
  type: "progression",
};

/**
 * RetroAchievements user achievement fixture.
 */
export const RA_USER_ACHIEVEMENT_FIXTURE: RAUserAchievement = {
  id: 1001,
  title: "First Star",
  description: "Collect your first Dragon Coin",
  points: 5,
  badgeName: "00001",
  dateEarned: "2026-01-10 14:30:00",
  dateEarnedHardcore: "2026-01-10 14:30:00",
  hardcoreAchieved: true,
};

/**
 * RetroAchievements credentials fixture.
 */
export const RA_CREDENTIALS_FIXTURE: RACredentials = {
  username: "TestRetroPlayer",
  api_key: "RA_TEST_API_KEY_12345",
};

/**
 * RetroAchievements sync result fixture.
 */
export const RA_SYNC_RESULT_FIXTURE: RASyncResult = {
  synced: 10,
  unlocked: 25,
  total: 96,
};

/**
 * Create RetroAchievements user profile with overrides.
 *
 * @param overrides - Partial overrides to apply to the base fixture
 * @returns New RAUserProfile with overrides applied
 */
export function createRAUserProfileFixture(overrides?: Partial<RAUserProfile>): RAUserProfile {
  return { ...RA_USER_PROFILE_FIXTURE, ...overrides };
}

/**
 * Create RetroAchievements game info with overrides.
 *
 * @param overrides - Partial overrides to apply to the base fixture
 * @returns New RAGameInfo with overrides applied
 */
export function createRAGameInfoFixture(overrides?: Partial<RAGameInfo>): RAGameInfo {
  return { ...RA_GAME_INFO_FIXTURE, ...overrides };
}

/**
 * Create RetroAchievements achievement with overrides.
 *
 * @param overrides - Partial overrides to apply to the base fixture
 * @returns New RAAchievement with overrides applied
 */
export function createRAAchievementFixture(overrides?: Partial<RAAchievement>): RAAchievement {
  return { ...RA_ACHIEVEMENT_FIXTURE, ...overrides };
}

/**
 * Create RetroAchievements user achievement with overrides.
 *
 * @param overrides - Partial overrides to apply to the base fixture
 * @returns New RAUserAchievement with overrides applied
 */
export function createRAUserAchievementFixture(
  overrides?: Partial<RAUserAchievement>
): RAUserAchievement {
  return { ...RA_USER_ACHIEVEMENT_FIXTURE, ...overrides };
}

/**
 * Create RetroAchievements credentials with overrides.
 *
 * @param overrides - Partial overrides to apply to the base fixture
 * @returns New RACredentials with overrides applied
 */
export function createRACredentialsFixture(overrides?: Partial<RACredentials>): RACredentials {
  return { ...RA_CREDENTIALS_FIXTURE, ...overrides };
}

/**
 * Create RetroAchievements sync result with overrides.
 *
 * @param overrides - Partial overrides to apply to the base fixture
 * @returns New RASyncResult with overrides applied
 */
export function createRASyncResultFixture(overrides?: Partial<RASyncResult>): RASyncResult {
  return { ...RA_SYNC_RESULT_FIXTURE, ...overrides };
}
