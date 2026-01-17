import type { IgdbGame, IgdbPlatform, IgdbFranchise, IgdbTokenResponse } from "@/integrations/igdb";

/**
 * Test fixture for IGDB token response.
 */
export const IGDB_TOKEN_FIXTURE: IgdbTokenResponse = {
  access_token: "test-access-token-12345",
  expires_in: 5184000, // 60 days in seconds
  token_type: "bearer",
};

/**
 * Test fixture for a basic IGDB game.
 */
export const IGDB_GAME_FIXTURE: IgdbGame = {
  id: 12345,
  name: "The Witcher 3: Wild Hunt",
  slug: "the-witcher-3-wild-hunt",
  summary: "An action RPG set in a dark fantasy world.",
  first_release_date: 1431993600, // 2015-05-19
  aggregated_rating: 92.5,
  cover: {
    id: 1,
    image_id: "co1wyy",
  },
  platforms: [
    { id: 6, name: "PC (Microsoft Windows)", abbreviation: "PC" },
    { id: 48, name: "PlayStation 4", abbreviation: "PS4" },
    { id: 49, name: "Xbox One", abbreviation: "XONE" },
  ],
  genres: [
    { id: 12, name: "Role-playing (RPG)", slug: "role-playing-rpg" },
    { id: 31, name: "Adventure", slug: "adventure" },
  ],
  themes: [
    { id: 1, name: "Action", slug: "action" },
    { id: 17, name: "Fantasy", slug: "fantasy" },
  ],
  game_modes: [{ id: 1, name: "Single player", slug: "single-player" }],
  franchises: [{ id: 452, name: "The Witcher" }],
  websites: [
    { id: 1, category: 1, url: "https://thewitcher.com" },
    { id: 2, category: 13, url: "https://store.steampowered.com/app/292030" },
    { id: 3, category: 17, url: "https://www.gog.com/game/the_witcher_3_wild_hunt" },
  ],
};

/**
 * Test fixture for IGDB game search results (minimal).
 */
export const IGDB_SEARCH_RESULTS_FIXTURE: IgdbGame[] = [
  {
    id: 12345,
    name: "The Witcher 3: Wild Hunt",
    slug: "the-witcher-3-wild-hunt",
    cover: { id: 1, image_id: "co1wyy" },
    platforms: [{ id: 6, name: "PC (Microsoft Windows)", abbreviation: "PC" }],
    franchises: [{ id: 452, name: "The Witcher" }],
  },
  {
    id: 1942,
    name: "The Witcher 2: Assassins of Kings",
    slug: "the-witcher-2-assassins-of-kings",
    cover: { id: 2, image_id: "co2abc" },
    platforms: [{ id: 6, name: "PC (Microsoft Windows)", abbreviation: "PC" }],
    franchises: [{ id: 452, name: "The Witcher" }],
  },
];

/**
 * Test fixture for IGDB platform.
 */
export const IGDB_PLATFORM_FIXTURE: IgdbPlatform = {
  id: 6,
  name: "PC (Microsoft Windows)",
  abbreviation: "PC",
  slug: "win",
  platform_family: { id: 1, name: "PC" },
  generation: undefined,
};

/**
 * Test fixture for IGDB franchise.
 */
export const IGDB_FRANCHISE_FIXTURE: IgdbFranchise = {
  id: 452,
  name: "The Witcher",
  slug: "the-witcher",
  games: [12345, 1942, 20],
};

/**
 * IGDB API error response structure.
 */
interface IgdbErrorResponse {
  status: number;
  message: string;
}

/**
 * Test fixture for IGDB API error response.
 */
export const IGDB_ERROR_FIXTURE: IgdbErrorResponse = {
  status: 401,
  message: "Invalid or expired access token",
};

/**
 * Create a custom IGDB game fixture with overrides.
 *
 * @param overrides - Partial overrides to apply to the base fixture
 * @returns New IgdbGame with overrides applied
 */
export function createIgdbGameFixture(overrides?: Partial<IgdbGame>): IgdbGame {
  return { ...IGDB_GAME_FIXTURE, ...overrides };
}

/**
 * Create a custom IGDB platform fixture with overrides.
 *
 * @param overrides - Partial overrides to apply to the base fixture
 * @returns New IgdbPlatform with overrides applied
 */
export function createIgdbPlatformFixture(overrides?: Partial<IgdbPlatform>): IgdbPlatform {
  return { ...IGDB_PLATFORM_FIXTURE, ...overrides };
}
