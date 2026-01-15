import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  real,
  date,
  bigint,
  unique,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 50 }).unique().notNull(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_username").on(table.username),
  ]
);

export const webauthnCredentials = pgTable(
  "webauthn_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialId: text("credential_id").unique().notNull(),
    publicKey: text("public_key").notNull(),
    counter: bigint("counter", { mode: "number" }).notNull().default(0),
    deviceName: varchar("device_name", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastUsed: timestamp("last_used", { withTimezone: true }),
  },
  (table) => [index("idx_webauthn_user").on(table.userId)]
);

// ============================================================================
// GAMES & METADATA
// ============================================================================

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rawgId: integer("rawg_id").unique(),
    igdbId: integer("igdb_id"),
    name: text("name").notNull(),
    slug: text("slug"),
    releaseDate: date("release_date"),
    description: text("description"),
    coverArtUrl: text("cover_art_url"),
    backgroundImageUrl: text("background_image_url"),
    metacriticScore: integer("metacritic_score"),
    opencriticScore: real("opencritic_score"),
    esrbRating: varchar("esrb_rating", { length: 50 }),
    seriesName: text("series_name"),
    expectedPlaytime: integer("expected_playtime"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_games_name").on(table.name),
    index("idx_games_rawg").on(table.rawgId),
    index("idx_games_slug").on(table.slug),
    index("idx_games_series").on(table.seriesName),
  ]
);

export const genres = pgTable("genres", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  rawgId: integer("rawg_id").unique(),
});

export const gameGenres = pgTable(
  "game_genres",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique().on(table.gameId, table.genreId),
    index("idx_game_genres_game").on(table.gameId),
    index("idx_game_genres_genre").on(table.genreId),
  ]
);

// ============================================================================
// PLATFORMS
// ============================================================================

export const platformTypeEnum = pgEnum("platform_type", ["pc", "console", "mobile", "physical"]);

export const platforms = pgTable("platforms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).unique().notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  platformType: platformTypeEnum("platform_type").notNull(),
  isSystem: boolean("is_system").default(false),
  isPhysical: boolean("is_physical").default(false),
  websiteUrl: text("website_url"),
  colorPrimary: varchar("color_primary", { length: 7 }).notNull().default("#6B7280"),
  defaultIconUrl: text("default_icon_url"),
  sortOrder: integer("sort_order").default(0),
});

export const userPlatforms = pgTable(
  "user_platforms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    username: varchar("username", { length: 100 }),
    iconUrl: text("icon_url"),
    profileUrl: text("profile_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.userId, table.platformId),
    index("idx_user_platforms_user").on(table.userId),
  ]
);

// ============================================================================
// USER LIBRARY
// ============================================================================

export const userGames = pgTable(
  "user_games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    platformGameId: text("platform_game_id"),
    owned: boolean("owned").default(true),
    purchasedDate: date("purchased_date"),
    importSource: varchar("import_source", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique().on(table.userId, table.gameId, table.platformId),
    index("idx_user_games_user").on(table.userId),
    index("idx_user_games_game").on(table.gameId),
    index("idx_user_games_platform").on(table.platformId),
  ]
);

// ============================================================================
// GAME ADDITIONS (DLC/Expansions/Editions)
// ============================================================================

export const additionTypeEnum = pgEnum("addition_type", ["dlc", "edition", "other"]);

export const gameAdditions = pgTable(
  "game_additions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    rawgAdditionId: integer("rawg_addition_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug"),
    released: date("released"),
    coverImageUrl: text("cover_image_url"),
    additionType: additionTypeEnum("addition_type").notNull().default("dlc"),
    isCompleteEdition: boolean("is_complete_edition").default(false),
    weight: real("weight").default(1),
    requiredForFull: boolean("required_for_full").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique().on(table.gameId, table.rawgAdditionId),
    index("idx_game_additions_game").on(table.gameId),
    index("idx_game_additions_type").on(table.additionType),
  ]
);

// User's display edition preference (which RAWG edition metadata to show)
export const userGameDisplayEditions = pgTable(
  "user_game_display_editions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    rawgEditionId: integer("rawg_edition_id"),
    editionName: text("edition_name").notNull(),
    coverArtUrl: text("cover_art_url"),
    backgroundImageUrl: text("background_image_url"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique().on(table.userId, table.gameId, table.platformId),
    index("idx_user_game_display_editions_user").on(table.userId),
    index("idx_user_game_display_editions_game").on(table.gameId),
  ]
);

// User's owned edition per game/platform
export const userGameEditions = pgTable(
  "user_game_editions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    editionId: uuid("edition_id").references(() => gameAdditions.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique().on(table.userId, table.gameId, table.platformId),
    index("idx_user_game_editions_user").on(table.userId),
    index("idx_user_game_editions_game").on(table.gameId),
  ]
);

// User's owned DLCs per game/platform (for standard edition owners)
export const userGameAdditions = pgTable(
  "user_game_additions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    additionId: uuid("addition_id")
      .notNull()
      .references(() => gameAdditions.id, { onDelete: "cascade" }),
    owned: boolean("owned").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique().on(table.userId, table.gameId, table.platformId, table.additionId),
    index("idx_user_game_additions_user").on(table.userId),
    index("idx_user_game_additions_game").on(table.gameId),
  ]
);

// ============================================================================
// PLAYTIME & PROGRESS
// ============================================================================

export const playSessions = pgTable(
  "play_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationMinutes: integer("duration_minutes"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_play_sessions_user").on(table.userId),
    index("idx_play_sessions_game").on(table.gameId),
    index("idx_play_sessions_date").on(table.startedAt),
  ]
);

export const completionTypeEnum = pgEnum("completion_type", [
  "main",
  "dlc",
  "full",
  "completionist",
]);

export const completionLogs = pgTable(
  "completion_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    completionType: completionTypeEnum("completion_type").notNull().default("main"),
    dlcId: uuid("dlc_id").references(() => gameAdditions.id, { onDelete: "cascade" }),
    percentage: integer("percentage").notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow(),
    notes: text("notes"),
  },
  (table) => [
    index("idx_completion_logs_user").on(table.userId),
    index("idx_completion_logs_game").on(table.gameId),
    index("idx_completion_logs_date").on(table.loggedAt),
    index("idx_completion_logs_type").on(table.completionType),
    index("idx_completion_logs_dlc").on(table.dlcId),
    check("percentage_check", sql`percentage >= 0 AND percentage <= 100`),
  ]
);

export const userPlaytime = pgTable(
  "user_playtime",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    totalMinutes: integer("total_minutes").default(0),
    lastPlayed: timestamp("last_played", { withTimezone: true }),
  },
  (table) => [
    unique().on(table.userId, table.gameId, table.platformId),
    index("idx_user_playtime_user").on(table.userId),
  ]
);

export const userGameProgress = pgTable(
  "user_game_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    status: varchar("status", { length: 20 }).default("backlog"),
    completionPercentage: real("completion_percentage").default(0),
    userRating: integer("user_rating"),
    notes: text("notes"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    isFavorite: boolean("is_favorite").default(false),
  },
  (table) => [
    unique().on(table.userId, table.gameId, table.platformId),
    index("idx_user_progress_user").on(table.userId),
    index("idx_user_progress_status").on(table.status),
    index("idx_user_favorites").on(table.userId, table.isFavorite),
    check(
      "status_check",
      sql`status IN ('backlog', 'playing', 'finished', 'dropped', 'completed')`
    ),
    check("user_rating_check", sql`user_rating >= 1 AND user_rating <= 10`),
  ]
);

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    achievementId: text("achievement_id").notNull(),
    name: text("name"),
    description: text("description"),
    iconUrl: text("icon_url"),
    rarityPercentage: real("rarity_percentage"),
    points: integer("points"),
  },
  (table) => [
    unique().on(table.gameId, table.platformId, table.achievementId),
    index("idx_achievements_game_platform").on(table.gameId, table.platformId),
  ]
);

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlocked: boolean("unlocked").default(false),
    unlockDate: timestamp("unlock_date", { withTimezone: true }),
  },
  (table) => [
    unique().on(table.userId, table.achievementId),
    index("idx_user_achievements_user").on(table.userId),
    index("idx_user_achievements_unlocked").on(table.unlocked),
  ]
);

// ============================================================================
// COMPLETION TIMES & DIFFICULTY
// ============================================================================

export const gameCompletionTimes = pgTable("game_completion_times", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .unique()
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  mainStoryHours: real("main_story_hours"),
  mainExtrasHours: real("main_extras_hours"),
  completionistHours: real("completionist_hours"),
  source: varchar("source", { length: 50 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const psnprofilesData = pgTable("psnprofiles_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .unique()
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  difficultyRating: real("difficulty_rating"),
  trophyCountBronze: integer("trophy_count_bronze"),
  trophyCountSilver: integer("trophy_count_silver"),
  trophyCountGold: integer("trophy_count_gold"),
  trophyCountPlatinum: integer("trophy_count_platinum"),
  averageCompletionTimeHours: real("average_completion_time_hours"),
  psnprofilesUrl: text("psnprofiles_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// RAWG ACHIEVEMENTS (cached from RAWG API)
// ============================================================================

export const gameRawgAchievements = pgTable(
  "game_rawg_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    rawgAchievementId: integer("rawg_achievement_id").notNull(),
    name: text("name"),
    description: text("description"),
    imageUrl: text("image_url"),
    rarityPercent: real("rarity_percent"),
  },
  (table) => [
    unique().on(table.gameId, table.rawgAchievementId),
    index("idx_game_rawg_achievements_game").on(table.gameId),
  ]
);

export const userRawgAchievements = pgTable(
  "user_rawg_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id, { onDelete: "cascade" }),
    rawgAchievementId: integer("rawg_achievement_id").notNull(),
    completed: boolean("completed").default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    unique().on(table.userId, table.gameId, table.platformId, table.rawgAchievementId),
    index("idx_user_rawg_achievements_user").on(table.userId),
    index("idx_user_rawg_achievements_game").on(table.gameId),
    index("idx_user_rawg_achievements_platform").on(table.platformId),
  ]
);

// ============================================================================
// COLLECTIONS
// ============================================================================

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    coverFilename: text("cover_filename"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_collections_user").on(table.userId)]
);

export const collectionGames = pgTable(
  "collection_games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique().on(table.collectionId, table.gameId),
    index("idx_collection_games_collection").on(table.collectionId),
  ]
);

// ============================================================================
// USER CUSTOM FIELDS
// ============================================================================

export const userGameCustomFields = pgTable(
  "user_game_custom_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    completionPercentage: integer("completion_percentage"),
    difficultyRating: integer("difficulty_rating"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique().on(table.userId, table.gameId, table.platformId),
    index("idx_custom_fields_user_game").on(table.userId, table.gameId),
    check(
      "completion_percentage_check",
      sql`completion_percentage >= 0 AND completion_percentage <= 100`
    ),
    check("difficulty_rating_check", sql`difficulty_rating >= 1 AND difficulty_rating <= 10`),
  ]
);

// ============================================================================
// SYNC HISTORY
// ============================================================================

export const syncHistory = pgTable(
  "sync_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    syncStarted: timestamp("sync_started", { withTimezone: true }).notNull(),
    syncCompleted: timestamp("sync_completed", { withTimezone: true }),
    status: varchar("status", { length: 20 }),
    gamesSynced: integer("games_synced").default(0),
    achievementsSynced: integer("achievements_synced").default(0),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("idx_sync_history_user").on(table.userId),
    index("idx_sync_history_platform").on(table.platformId),
    check("sync_status_check", sql`status IN ('running', 'completed', 'failed')`),
  ]
);

// ============================================================================
// USER PREFERENCES
// ============================================================================

export const userPreferences = pgTable(
  "user_preferences",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    defaultView: varchar("default_view", { length: 10 }).default("grid"),
    itemsPerPage: integer("items_per_page").default(25),
    theme: varchar("theme", { length: 20 }).default("dark"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  () => [
    check("default_view_check", sql`default_view IN ('grid', 'table')`),
    check("items_per_page_check", sql`items_per_page IN (10, 25, 50, 100)`),
    check("theme_check", sql`theme IN ('light', 'dark', 'auto')`),
  ]
);

// ============================================================================
// ADMIN SETTINGS (Instance-Level Configuration)
// ============================================================================

export const analyticsProviderEnum = pgEnum("analytics_provider", [
  "umami",
  "plausible",
  "posthog",
  "google-analytics",
])

export const adminSettings = pgTable("admin_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  analyticsEnabled: boolean("analytics_enabled").default(false).notNull(),
  analyticsProvider: analyticsProviderEnum("analytics_provider"),
  analyticsKey: varchar("analytics_key", { length: 255 }),
  analyticsHost: text("analytics_host"),
  searchServerSide: boolean("search_server_side").default(true).notNull(),
  searchDebounceMs: integer("search_debounce_ms").default(300).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})
