-- Seed default system platforms

-- PC Stores (sort_order 100-199)
INSERT INTO platforms (name, display_name, platform_type, is_system, color_primary, website_url, sort_order) VALUES
('steam', 'Steam', 'pc', true, '#1B2838', 'https://store.steampowered.com', 100),
('epic-games-store', 'Epic Games', 'pc', true, '#313131', 'https://store.epicgames.com', 101),
('gog', 'GOG', 'pc', true, '#86328A', 'https://www.gog.com', 102),
('battle-net', 'Battle.net', 'pc', true, '#148EFF', 'https://www.blizzard.com/apps/battle.net', 103),
('ea-app', 'EA App', 'pc', true, '#FF0844', 'https://www.ea.com/ea-app', 104),
('ubisoft-connect', 'Ubisoft Connect', 'pc', true, '#0080FF', 'https://ubisoftconnect.com', 105),
('rockstar-games-launcher', 'Rockstar Games Launcher', 'pc', true, '#FCAF17', 'https://www.rockstargames.com/rockstar-games-launcher', 106),
('bethesda-launcher', 'Bethesda', 'pc', true, '#D4AF37', 'https://bethesda.net', 107)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  platform_type = EXCLUDED.platform_type,
  is_system = EXCLUDED.is_system,
  color_primary = EXCLUDED.color_primary,
  website_url = EXCLUDED.website_url,
  sort_order = EXCLUDED.sort_order;

-- Console Stores (sort_order 200-299)
INSERT INTO platforms (name, display_name, platform_type, is_system, color_primary, website_url, sort_order) VALUES
('playstation-network', 'PlayStation Network', 'console', true, '#0070CC', 'https://www.playstation.com', 200),
('xbox', 'Xbox', 'console', true, '#107C10', 'https://www.xbox.com', 201),
('nintendo-eshop', 'Nintendo eShop', 'console', true, '#E60012', 'https://www.nintendo.com', 202)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  platform_type = EXCLUDED.platform_type,
  is_system = EXCLUDED.is_system,
  color_primary = EXCLUDED.color_primary,
  website_url = EXCLUDED.website_url,
  sort_order = EXCLUDED.sort_order;

-- Mobile Stores (sort_order 300-399)
INSERT INTO platforms (name, display_name, platform_type, is_system, color_primary, website_url, sort_order) VALUES
('apple-app-store', 'Apple App Store', 'mobile', true, '#007AFF', 'https://apps.apple.com', 300),
('google-play-store', 'Google Play Store', 'mobile', true, '#01875F', 'https://play.google.com', 301)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  platform_type = EXCLUDED.platform_type,
  is_system = EXCLUDED.is_system,
  color_primary = EXCLUDED.color_primary,
  website_url = EXCLUDED.website_url,
  sort_order = EXCLUDED.sort_order;

-- Physical (sort_order 400-499)
-- Physical Copy (Generic) - with predefined disc icon
INSERT INTO platforms (name, display_name, platform_type, is_system, is_physical, color_primary, default_icon_url, sort_order) VALUES
('physical-copy', 'Physical Copy', 'physical', true, true, '#6B7280', 
  'data:image/svg+xml,%3Csvg xmlns=''http://www.w3.org/2000/svg'' viewBox=''0 0 24 24'' fill=''white''%3E%3Cpath d=''M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 5.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z''/%3E%3C/svg%3E', 
  400),
('playstation-physical', 'PlayStation Physical', 'physical', true, true, '#0070CC', NULL, 401),
('xbox-physical', 'Xbox Physical', 'physical', true, true, '#107C10', NULL, 402),
('nintendo-physical', 'Nintendo Physical', 'physical', true, true, '#E60012', NULL, 403),
('pc-physical', 'PC Physical', 'physical', true, true, '#4B5563', NULL, 404)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  platform_type = EXCLUDED.platform_type,
  is_system = EXCLUDED.is_system,
  is_physical = EXCLUDED.is_physical,
  color_primary = EXCLUDED.color_primary,
  default_icon_url = EXCLUDED.default_icon_url,
  sort_order = EXCLUDED.sort_order;
