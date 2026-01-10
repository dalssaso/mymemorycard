// Type definitions for the backend

/**
 * User entity type - imported and re-exported from auth feature.
 * Uses camelCase properties (passwordHash, createdAt, updatedAt)
 * which map to snake_case database columns.
 */
import type { User } from "@/features/auth/repositories/user.repository.interface";
export type { User };

export interface Game {
  id: string;
  rawg_id?: number;
  igdb_id?: number;
  name: string;
  slug?: string;
  release_date?: Date;
  description?: string;
  cover_art_url?: string;
  background_image_url?: string;
  metacritic_score?: number;
  opencritic_score?: number;
  esrb_rating?: string;
  series_name?: string;
  expected_playtime?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Platform {
  id: string;
  name: string;
  display_name: string;
  platform_type: "pc" | "console" | "mobile" | "physical";
  is_system: boolean;
  is_physical: boolean;
  website_url: string | null;
  color_primary: string;
  default_icon_url: string | null;
  sort_order: number;
}

export interface UserGame {
  id: string;
  user_id: string;
  game_id: string;
  platform_id: string;
  platform_game_id?: string;
  owned: boolean;
  purchased_date?: Date;
  import_source?: string;
  created_at: Date;
}

export interface JWTPayload {
  userId: string;
  username: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface RouteHandler {
  (req: Request, params?: Record<string, string>): Promise<Response>;
}

export interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
  requiresAuth?: boolean;
}
