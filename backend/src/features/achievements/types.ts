/**
 * Normalized achievement type for cross-integration use.
 * Used by both Steam and RetroAchievements services.
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
