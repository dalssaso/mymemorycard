/**
 * Game domain model representing a single game in the system.
 * Contains core game metadata from IGDB or RAWG sources.
 */
export interface Game {
  /** Unique identifier for the game */
  id: string;
  /** IGDB platform identifier, null if not synced from IGDB */
  igdb_id: number | null;
  /** RAWG platform identifier, null if not synced from RAWG */
  rawg_id: number | null;
  /** Game title */
  name: string;
  /** URL-friendly slug for the game */
  slug: string | null;
  /** Game release date */
  release_date: Date | null;
  /** Full game description or synopsis */
  description: string | null;
  /** URL to cover art image */
  cover_art_url: string | null;
  /** URL to background image */
  background_image_url: string | null;
  /** Metacritic score (0-100) */
  metacritic_score: number | null;
  /** OpenCritic score (0-100) */
  opencritic_score: number | null;
  /** ESRB rating (E, E10+, T, M, AO) */
  esrb_rating: string | null;
  /** Name of game series if applicable */
  series_name: string | null;
  /** Expected playtime in hours */
  expected_playtime: number | null;
  /** Source of metadata (igdb, rawg, or manual) */
  metadata_source: "igdb" | "rawg" | "manual";
  /** Timestamp when game was added to system */
  created_at: Date;
  /** Timestamp when game metadata was last updated */
  updated_at: Date;
}

/**
 * User library entry representing a game in a user's collection on a specific platform.
 * Tracks ownership and platform-specific information.
 */
export interface UserGame {
  /** Unique identifier for the user game entry */
  id: string;
  /** ID of the user who owns the game */
  user_id: string;
  /** ID of the game */
  game_id: string;
  /** ID of the platform this entry is for */
  platform_id: string;
  /** ID of the store where purchased, null if not purchased */
  store_id: string | null;
  /** Platform-specific game identifier (e.g., Steam App ID) */
  platform_game_id: string | null;
  /** Whether the user owns this game on this platform */
  owned: boolean;
  /** Date when user purchased the game */
  purchased_date: Date | null;
  /** Source of import if applicable (steam, rawg, etc.) */
  import_source: string | null;
  /** Timestamp when entry was created */
  created_at: Date;
}

/**
 * User game entry with related game, platform, and store information.
 * Used for API responses that need nested relationship data.
 */
export interface UserGameWithRelations extends UserGame {
  /** Game information */
  game: {
    id: string;
    name: string;
    cover_art_url: string | null;
  };
  /** Platform information */
  platform: {
    id: string;
    name: string;
    abbreviation: string | null;
  };
  /** Store information (null if not purchased from a store) */
  store: {
    id: string;
    slug: string;
    display_name: string;
  } | null;
}

/**
 * Game with related platform and store information.
 * Combines game metadata with its available platforms and stores.
 */
export interface GameWithRelations extends Game {
  /** Array of platforms this game is available on */
  platforms: Array<{
    id: string;
    name: string;
    igdb_platform_id: number | null;
  }>;
  /** Array of stores selling this game */
  stores?: Array<{
    id: string;
    slug: string;
    display_name: string;
  }>;
}

/**
 * Platform model representing a gaming platform (e.g., PlayStation 5, PC, Xbox).
 * Read-only from the games feature perspective.
 */
export interface Platform {
  /** Unique identifier for the platform */
  id: string;
  /** IGDB platform identifier */
  igdb_platform_id: number | null;
  /** Platform display name */
  name: string;
  /** Short abbreviation (e.g., PS5, PC) */
  abbreviation: string | null;
  /** URL-friendly slug */
  slug: string | null;
  /** Platform family grouping (console, handheld, pc) */
  platform_family: string | null;
  /** Primary color for UI representation (hex format) */
  color_primary: string;
  /** Timestamp when platform was added to system */
  created_at: Date | null;
}

/**
 * Store model representing a game store or storefront (digital or physical).
 * Read-only from the games feature perspective.
 */
export interface Store {
  /** Unique identifier for the store */
  id: string;
  /** URL-friendly slug (e.g., 'steam', 'gog', 'playstation-store') */
  slug: string;
  /** Human-readable display name */
  display_name: string;
  /** Store type: digital (Steam, GOG) or physical (GameStop) */
  store_type: "digital" | "physical";
  /** Platform family this store is associated with */
  platform_family: string | null;
  /** Primary color for UI representation (hex format) */
  color_primary: string;
  /** Official website URL */
  website_url: string | null;
  /** URL to store icon/logo */
  icon_url: string | null;
  /** Whether store supports achievement tracking */
  supports_achievements: boolean;
  /** Whether store supports library sync */
  supports_library_sync: boolean;
  /** IGDB website category identifier */
  igdb_website_category: number | null;
  /** Display order in UI lists */
  sort_order: number;
  /** Timestamp when store was added to system */
  created_at: Date;
}
