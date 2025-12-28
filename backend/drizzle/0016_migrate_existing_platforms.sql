-- Migrate existing user data to new system platforms

-- Map Epic Games Store (old) to epic-games-store (new system platform)
DO $$
DECLARE
  old_epic_id uuid;
  new_epic_id uuid;
BEGIN
  SELECT id INTO old_epic_id FROM platforms WHERE name = 'epic' AND is_system = false;
  SELECT id INTO new_epic_id FROM platforms WHERE name = 'epic-games-store' AND is_system = true;
  
  IF old_epic_id IS NOT NULL AND new_epic_id IS NOT NULL THEN
    -- Update user_platforms
    UPDATE user_platforms SET platform_id = new_epic_id WHERE platform_id = old_epic_id;
    -- Update user_games
    UPDATE user_games SET platform_id = new_epic_id WHERE platform_id = old_epic_id;
    -- Update all other tables referencing platforms
    UPDATE user_game_progress SET platform_id = new_epic_id WHERE platform_id = old_epic_id;
    UPDATE user_playtime SET platform_id = new_epic_id WHERE platform_id = old_epic_id;
    UPDATE play_sessions SET platform_id = new_epic_id WHERE platform_id = old_epic_id;
    UPDATE completion_logs SET platform_id = new_epic_id WHERE platform_id = old_epic_id;
    UPDATE achievements SET platform_id = new_epic_id WHERE platform_id = old_epic_id;
    UPDATE user_achievements ua SET achievement_id = a.id 
      FROM achievements a, achievements old_a 
      WHERE old_a.platform_id = old_epic_id 
        AND a.platform_id = new_epic_id 
        AND a.game_id = old_a.game_id 
        AND a.achievement_id = old_a.achievement_id
        AND ua.achievement_id = old_a.id;
    UPDATE user_game_additions SET platform_id = new_epic_id WHERE platform_id = old_epic_id;
    UPDATE user_game_display_editions SET platform_id = new_epic_id WHERE platform_id = old_epic_id;
    UPDATE user_game_editions SET platform_id = new_epic_id WHERE platform_id = old_epic_id;
    UPDATE user_game_custom_fields SET platform_id = new_epic_id WHERE platform_id = old_epic_id;
    UPDATE user_rawg_achievements SET platform_id = new_epic_id WHERE platform_id = old_epic_id;
    UPDATE sync_history SET platform_id = new_epic_id WHERE platform_id = old_epic_id;
    -- Delete old platform
    DELETE FROM platforms WHERE id = old_epic_id;
  END IF;
END $$;

-- Map PlayStation variants to PlayStation Network
DO $$
DECLARE
  new_psn_id uuid;
  old_platform_record RECORD;
BEGIN
  SELECT id INTO new_psn_id FROM platforms WHERE name = 'playstation-network' AND is_system = true;
  
  IF new_psn_id IS NOT NULL THEN
    FOR old_platform_record IN 
      SELECT id FROM platforms WHERE name IN ('playstation1', 'psn') AND is_system = false
    LOOP
      -- Update all references
      UPDATE user_platforms SET platform_id = new_psn_id WHERE platform_id = old_platform_record.id;
      UPDATE user_games SET platform_id = new_psn_id WHERE platform_id = old_platform_record.id;
      UPDATE user_game_progress SET platform_id = new_psn_id WHERE platform_id = old_platform_record.id;
      UPDATE user_playtime SET platform_id = new_psn_id WHERE platform_id = old_platform_record.id;
      UPDATE play_sessions SET platform_id = new_psn_id WHERE platform_id = old_platform_record.id;
      UPDATE completion_logs SET platform_id = new_psn_id WHERE platform_id = old_platform_record.id;
      UPDATE achievements SET platform_id = new_psn_id WHERE platform_id = old_platform_record.id;
      UPDATE user_game_additions SET platform_id = new_psn_id WHERE platform_id = old_platform_record.id;
      UPDATE user_game_display_editions SET platform_id = new_psn_id WHERE platform_id = old_platform_record.id;
      UPDATE user_game_editions SET platform_id = new_psn_id WHERE platform_id = old_platform_record.id;
      UPDATE user_game_custom_fields SET platform_id = new_psn_id WHERE platform_id = old_platform_record.id;
      UPDATE user_rawg_achievements SET platform_id = new_psn_id WHERE platform_id = old_platform_record.id;
      UPDATE sync_history SET platform_id = new_psn_id WHERE platform_id = old_platform_record.id;
      -- Delete old platform
      DELETE FROM platforms WHERE id = old_platform_record.id;
    END LOOP;
  END IF;
END $$;

-- Map Nintendo Switch to Nintendo eShop
DO $$
DECLARE
  old_switch_id uuid;
  new_nintendo_id uuid;
BEGIN
  SELECT id INTO old_switch_id FROM platforms WHERE name = 'nintendo-switch' AND is_system = false;
  SELECT id INTO new_nintendo_id FROM platforms WHERE name = 'nintendo-eshop' AND is_system = true;
  
  IF old_switch_id IS NOT NULL AND new_nintendo_id IS NOT NULL THEN
    -- Update all references
    UPDATE user_platforms SET platform_id = new_nintendo_id WHERE platform_id = old_switch_id;
    UPDATE user_games SET platform_id = new_nintendo_id WHERE platform_id = old_switch_id;
    UPDATE user_game_progress SET platform_id = new_nintendo_id WHERE platform_id = old_switch_id;
    UPDATE user_playtime SET platform_id = new_nintendo_id WHERE platform_id = old_switch_id;
    UPDATE play_sessions SET platform_id = new_nintendo_id WHERE platform_id = old_switch_id;
    UPDATE completion_logs SET platform_id = new_nintendo_id WHERE platform_id = old_switch_id;
    UPDATE achievements SET platform_id = new_nintendo_id WHERE platform_id = old_switch_id;
    UPDATE user_game_additions SET platform_id = new_nintendo_id WHERE platform_id = old_switch_id;
    UPDATE user_game_display_editions SET platform_id = new_nintendo_id WHERE platform_id = old_switch_id;
    UPDATE user_game_editions SET platform_id = new_nintendo_id WHERE platform_id = old_switch_id;
    UPDATE user_game_custom_fields SET platform_id = new_nintendo_id WHERE platform_id = old_switch_id;
    UPDATE user_rawg_achievements SET platform_id = new_nintendo_id WHERE platform_id = old_switch_id;
    UPDATE sync_history SET platform_id = new_nintendo_id WHERE platform_id = old_switch_id;
    -- Delete old platform
    DELETE FROM platforms WHERE id = old_switch_id;
  END IF;
END $$;

-- Map Xbox (old) to Xbox (new system platform)
DO $$
DECLARE
  old_xbox_id uuid;
  new_xbox_id uuid;
BEGIN
  SELECT id INTO old_xbox_id FROM platforms WHERE name = 'xbox-old' AND is_system = false;
  SELECT id INTO new_xbox_id FROM platforms WHERE name = 'xbox' AND is_system = true;
  
  IF old_xbox_id IS NOT NULL AND new_xbox_id IS NOT NULL THEN
    -- Update all references
    UPDATE user_platforms SET platform_id = new_xbox_id WHERE platform_id = old_xbox_id;
    UPDATE user_games SET platform_id = new_xbox_id WHERE platform_id = old_xbox_id;
    UPDATE user_game_progress SET platform_id = new_xbox_id WHERE platform_id = old_xbox_id;
    UPDATE user_playtime SET platform_id = new_xbox_id WHERE platform_id = old_xbox_id;
    UPDATE play_sessions SET platform_id = new_xbox_id WHERE platform_id = old_xbox_id;
    UPDATE completion_logs SET platform_id = new_xbox_id WHERE platform_id = old_xbox_id;
    UPDATE achievements SET platform_id = new_xbox_id WHERE platform_id = old_xbox_id;
    UPDATE user_game_additions SET platform_id = new_xbox_id WHERE platform_id = old_xbox_id;
    UPDATE user_game_display_editions SET platform_id = new_xbox_id WHERE platform_id = old_xbox_id;
    UPDATE user_game_editions SET platform_id = new_xbox_id WHERE platform_id = old_xbox_id;
    UPDATE user_game_custom_fields SET platform_id = new_xbox_id WHERE platform_id = old_xbox_id;
    UPDATE user_rawg_achievements SET platform_id = new_xbox_id WHERE platform_id = old_xbox_id;
    UPDATE sync_history SET platform_id = new_xbox_id WHERE platform_id = old_xbox_id;
    -- Delete old platform
    DELETE FROM platforms WHERE id = old_xbox_id;
  END IF;
END $$;

-- Map Android to Google Play Store
DO $$
DECLARE
  old_android_id uuid;
  new_playstore_id uuid;
BEGIN
  SELECT id INTO old_android_id FROM platforms WHERE name = 'android' AND is_system = false;
  SELECT id INTO new_playstore_id FROM platforms WHERE name = 'google-play-store' AND is_system = true;
  
  IF old_android_id IS NOT NULL AND new_playstore_id IS NOT NULL THEN
    -- Update all references
    UPDATE user_platforms SET platform_id = new_playstore_id WHERE platform_id = old_android_id;
    UPDATE user_games SET platform_id = new_playstore_id WHERE platform_id = old_android_id;
    UPDATE user_game_progress SET platform_id = new_playstore_id WHERE platform_id = old_android_id;
    UPDATE user_playtime SET platform_id = new_playstore_id WHERE platform_id = old_android_id;
    UPDATE play_sessions SET platform_id = new_playstore_id WHERE platform_id = old_android_id;
    UPDATE completion_logs SET platform_id = new_playstore_id WHERE platform_id = old_android_id;
    UPDATE achievements SET platform_id = new_playstore_id WHERE platform_id = old_android_id;
    UPDATE user_game_additions SET platform_id = new_playstore_id WHERE platform_id = old_android_id;
    UPDATE user_game_display_editions SET platform_id = new_playstore_id WHERE platform_id = old_android_id;
    UPDATE user_game_editions SET platform_id = new_playstore_id WHERE platform_id = old_android_id;
    UPDATE user_game_custom_fields SET platform_id = new_playstore_id WHERE platform_id = old_android_id;
    UPDATE user_rawg_achievements SET platform_id = new_playstore_id WHERE platform_id = old_android_id;
    UPDATE sync_history SET platform_id = new_playstore_id WHERE platform_id = old_android_id;
    -- Delete old platform
    DELETE FROM platforms WHERE id = old_android_id;
  END IF;
END $$;

-- Keep retro/legacy platforms (Apple II, Atari, etc.) as custom platforms - just mark them properly
UPDATE platforms 
SET is_system = false, 
    platform_type = CASE 
      WHEN platform_type IS NULL THEN 'physical'
      ELSE platform_type 
    END
WHERE name IN ('apple-ii', 'atari-2600', 'atari-5200', 'atari-7800', 'atari-8-bit', 
               'atari-flashback', 'atari-lynx', 'atari-st', 'atari-xegs', 
               'commodore-amiga', 'game-boy', 'game-boy-advance', 'game-boy-color', 
               'gamecube')
  AND is_system = false;

-- Delete unused RAWG platforms (no user_platforms or user_games references)
DELETE FROM platforms 
WHERE is_system = false 
  AND id NOT IN (SELECT DISTINCT platform_id FROM user_platforms)
  AND id NOT IN (SELECT DISTINCT platform_id FROM user_games);
