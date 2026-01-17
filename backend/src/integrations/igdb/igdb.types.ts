/**
 * IGDB API type definitions.
 * Based on IGDB API v4 documentation.
 * @see https://api-docs.igdb.com/
 */

/**
 * IGDB game response from /games endpoint.
 */
export interface IgdbGame {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  storyline?: string;
  cover?: IgdbCover;
  platforms?: IgdbPlatformRef[];
  genres?: IgdbGenre[];
  themes?: IgdbTheme[];
  game_modes?: IgdbGameMode[];
  player_perspectives?: IgdbPlayerPerspective[];
  franchises?: IgdbFranchiseRef[];
  websites?: IgdbWebsite[];
  release_dates?: IgdbReleaseDate[];
  first_release_date?: number;
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  total_rating?: number;
  total_rating_count?: number;
  category?: IgdbGameCategory;
  status?: IgdbGameStatus;
}

/**
 * IGDB cover image reference.
 */
export interface IgdbCover {
  id: number;
  image_id: string;
  url?: string;
  width?: number;
  height?: number;
}

/**
 * IGDB platform reference (embedded in game).
 */
export interface IgdbPlatformRef {
  id: number;
  name?: string;
  abbreviation?: string;
  slug?: string;
}

/**
 * IGDB platform full response from /platforms endpoint.
 */
export interface IgdbPlatform {
  id: number;
  name: string;
  abbreviation?: string;
  slug: string;
  platform_family?: IgdbPlatformFamilyRef;
  generation?: number;
  summary?: string;
}

/**
 * IGDB platform family reference.
 */
export interface IgdbPlatformFamilyRef {
  id: number;
  name?: string;
  slug?: string;
}

/**
 * IGDB genre reference.
 */
export interface IgdbGenre {
  id: number;
  name: string;
  slug: string;
}

/**
 * IGDB theme reference.
 */
export interface IgdbTheme {
  id: number;
  name: string;
  slug: string;
}

/**
 * IGDB game mode reference.
 */
export interface IgdbGameMode {
  id: number;
  name: string;
  slug: string;
}

/**
 * IGDB player perspective reference.
 */
export interface IgdbPlayerPerspective {
  id: number;
  name: string;
  slug: string;
}

/**
 * IGDB franchise reference.
 */
export interface IgdbFranchiseRef {
  id: number;
  name?: string;
  slug?: string;
}

/**
 * IGDB website reference.
 * Category codes: 1=official, 2=wikia, 3=wikipedia, 4=facebook, 5=twitter,
 * 6=twitch, 8=instagram, 9=youtube, 10=iphone, 11=ipad, 12=android, 13=steam,
 * 14=reddit, 15=itch, 16=epicgames, 17=gog, 18=discord
 */
export interface IgdbWebsite {
  id: number;
  category: number;
  url: string;
  trusted?: boolean;
}

/**
 * IGDB release date reference.
 */
export interface IgdbReleaseDate {
  id: number;
  date?: number;
  platform?: IgdbPlatformRef;
  region?: number;
  human?: string;
}

/**
 * IGDB franchise full response.
 */
export interface IgdbFranchise {
  id: number;
  name: string;
  slug: string;
  games?: number[];
}

/**
 * IGDB game category enum.
 */
export type IgdbGameCategory =
  | 0 // main_game
  | 1 // dlc_addon
  | 2 // expansion
  | 3 // bundle
  | 4 // standalone_expansion
  | 5 // mod
  | 6 // episode
  | 7 // season
  | 8 // remake
  | 9 // remaster
  | 10 // expanded_game
  | 11 // port
  | 12 // fork
  | 13 // pack
  | 14; // update

/**
 * IGDB game status enum.
 */
export type IgdbGameStatus =
  | 0 // released
  | 2 // alpha
  | 3 // beta
  | 4 // early_access
  | 5 // offline
  | 6 // cancelled
  | 7 // rumored
  | 8; // delisted

/**
 * IGDB Twitch OAuth token response.
 */
export interface IgdbTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * IGDB website category to store slug mapping.
 */
export const IGDB_WEBSITE_CATEGORY_TO_STORE: Record<number, string> = {
  13: "steam",
  17: "gog",
  16: "epic",
};

/**
 * Cover image URL builder for IGDB.
 * @param imageId - The image_id from cover object
 * @param size - Image size (see IGDB docs for sizes)
 * @returns Full URL to image
 */
export function buildCoverUrl(
  imageId: string,
  size: "cover_small" | "cover_big" | "720p" | "1080p" = "cover_big"
): string {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}
