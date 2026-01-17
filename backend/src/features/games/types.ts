/**
 * Game domain model representing a single game in the system.
 * Contains core game metadata from IGDB or RAWG sources.
 */
export interface Game {
  /** Unique identifier for the game */
  id: string;
  /** IGDB platform identifier, null if not synced from IGDB */
  igdbId: number | null;
  /** RAWG platform identifier, null if not synced from RAWG */
  rawgId: number | null;
  /** Game title */
  name: string;
  /** URL-friendly slug for the game */
  slug: string | null;
  /** Game release date */
  releaseDate: Date | null;
  /** Full game description or synopsis */
  description: string | null;
  /** URL to cover art image */
  coverArtUrl: string | null;
  /** URL to background image */
  backgroundImageUrl: string | null;
  /** Metacritic score (0-100) */
  metacriticScore: number | null;
  /** OpenCritic score (0-100) */
  opencriticScore: number | null;
  /** ESRB rating (E, E10+, T, M, AO) */
  esrbRating: string | null;
  /** Name of game series if applicable */
  seriesName: string | null;
  /** Expected playtime in hours */
  expectedPlaytime: number | null;
  /** Source of metadata (igdb, rawg, or manual) */
  metadataSource: "igdb" | "rawg" | "manual";
  /** Timestamp when game was added to system */
  createdAt: Date;
  /** Timestamp when game metadata was last updated */
  updatedAt: Date;
}

/**
 * User library entry representing a game in a user's collection on a specific platform.
 * Tracks ownership and platform-specific information.
 */
export interface UserGame {
  /** Unique identifier for the user game entry */
  id: string;
  /** ID of the user who owns the game */
  userId: string;
  /** ID of the game */
  gameId: string;
  /** ID of the platform this entry is for */
  platformId: string;
  /** ID of the store where purchased, null if not purchased */
  storeId: string | null;
  /** Platform-specific game identifier (e.g., Steam App ID) */
  platformGameId: string | null;
  /** Whether the user owns this game on this platform */
  owned: boolean;
  /** Date when user purchased the game */
  purchasedDate: Date | null;
  /** Source of import if applicable (steam, rawg, etc.) */
  importSource: string | null;
  /** Timestamp when entry was created */
  createdAt: Date;
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
    igdbPlatformId: number | null;
  }>;
  /** Array of stores selling this game */
  stores?: Array<{
    id: string;
    slug: string;
    displayName: string;
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
  igdbPlatformId: number | null;
  /** Platform display name */
  name: string;
  /** Short abbreviation (e.g., PS5, PC) */
  abbreviation: string | null;
  /** URL-friendly slug */
  slug: string | null;
  /** Platform family grouping (console, handheld, pc) */
  platformFamily: string | null;
  /** Primary color for UI representation (hex format) */
  colorPrimary: string;
  /** Timestamp when platform was added to system */
  createdAt: Date;
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
  displayName: string;
  /** Store type: digital (Steam, GOG) or physical (GameStop) */
  storeType: "digital" | "physical";
  /** Platform family this store is associated with */
  platformFamily: string | null;
  /** Primary color for UI representation (hex format) */
  colorPrimary: string;
  /** Official website URL */
  websiteUrl: string | null;
  /** URL to store icon/logo */
  iconUrl: string | null;
  /** Whether store supports achievement tracking */
  supportsAchievements: boolean;
  /** Whether store supports library sync */
  supportsLibrarySync: boolean;
  /** IGDB website category identifier */
  igdbWebsiteCategory: number | null;
  /** Display order in UI lists */
  sortOrder: number;
  /** Timestamp when store was added to system */
  createdAt: Date;
}
