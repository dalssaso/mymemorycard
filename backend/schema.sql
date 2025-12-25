-- Game Library Management System - Database Schema
-- PostgreSQL 16+ with UUIDv4

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    device_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used TIMESTAMPTZ
);

CREATE INDEX idx_webauthn_user ON webauthn_credentials(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================================================
-- GAMES & METADATA
-- ============================================================================

CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rawg_id INTEGER UNIQUE,
    igdb_id INTEGER,
    name TEXT NOT NULL,
    slug TEXT,
    release_date DATE,
    description TEXT,
    cover_art_url TEXT,
    background_image_url TEXT,
    metacritic_score INTEGER,
    opencritic_score REAL,
    esrb_rating VARCHAR(50),
    series_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_games_name ON games(name);
CREATE INDEX idx_games_rawg ON games(rawg_id);
CREATE INDEX idx_games_slug ON games(slug);
CREATE INDEX idx_games_series ON games(series_name) WHERE series_name IS NOT NULL;

CREATE TABLE genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    rawg_id INTEGER UNIQUE
);

CREATE TABLE game_genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    UNIQUE(game_id, genre_id)
);

CREATE INDEX idx_game_genres_game ON game_genres(game_id);
CREATE INDEX idx_game_genres_genre ON game_genres(genre_id);

-- ============================================================================
-- PLATFORMS
-- ============================================================================

CREATE TABLE platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    platform_type VARCHAR(20)
);

-- Seed platforms
INSERT INTO platforms (name, display_name, platform_type) VALUES
  ('steam', 'Steam', 'pc'),
  ('psn', 'PlayStation', 'console'),
  ('xbox', 'Xbox', 'console'),
  ('epic', 'Epic Games Store', 'pc')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- USER LIBRARY
-- ============================================================================

CREATE TABLE user_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES platforms(id),
    platform_game_id TEXT,
    owned BOOLEAN DEFAULT TRUE,
    purchased_date DATE,
    import_source VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, game_id, platform_id)
);

CREATE INDEX idx_user_games_user ON user_games(user_id);
CREATE INDEX idx_user_games_game ON user_games(game_id);
CREATE INDEX idx_user_games_platform ON user_games(platform_id);

-- ============================================================================
-- PLAYTIME & PROGRESS
-- ============================================================================

CREATE TABLE user_playtime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES platforms(id),
    total_minutes INTEGER DEFAULT 0,
    last_played TIMESTAMPTZ,
    UNIQUE(user_id, game_id, platform_id)
);

CREATE INDEX idx_user_playtime_user ON user_playtime(user_id);

CREATE TABLE user_game_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES platforms(id),
    status VARCHAR(20) CHECK(status IN ('backlog', 'playing', 'finished', 'dropped', 'completed')) DEFAULT 'backlog',
    completion_percentage REAL DEFAULT 0,
    user_rating INTEGER CHECK(user_rating >= 1 AND user_rating <= 10),
    notes TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_favorite BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, game_id, platform_id)
);

CREATE INDEX idx_user_progress_user ON user_game_progress(user_id);
CREATE INDEX idx_user_progress_status ON user_game_progress(status);
CREATE INDEX idx_user_favorites ON user_game_progress(user_id, is_favorite) WHERE is_favorite = TRUE;

-- ============================================================================
-- ACHIEVEMENTS
-- ============================================================================

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES platforms(id),
    achievement_id TEXT NOT NULL,
    name TEXT,
    description TEXT,
    icon_url TEXT,
    rarity_percentage REAL,
    points INTEGER,
    UNIQUE(game_id, platform_id, achievement_id)
);

CREATE INDEX idx_achievements_game_platform ON achievements(game_id, platform_id);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked BOOLEAN DEFAULT FALSE,
    unlock_date TIMESTAMPTZ,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(unlocked);

-- ============================================================================
-- COMPLETION TIMES & DIFFICULTY
-- ============================================================================

CREATE TABLE game_completion_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID UNIQUE NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    main_story_hours REAL,
    main_extras_hours REAL,
    completionist_hours REAL,
    source VARCHAR(50),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE psnprofiles_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID UNIQUE NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    difficulty_rating REAL,
    trophy_count_bronze INTEGER,
    trophy_count_silver INTEGER,
    trophy_count_gold INTEGER,
    trophy_count_platinum INTEGER,
    average_completion_time_hours REAL,
    psnprofiles_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COLLECTIONS
-- ============================================================================

CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE(collection_id, game_id)
);

CREATE INDEX idx_collections_user ON collections(user_id);
CREATE INDEX idx_collection_games_collection ON collection_games(collection_id);

-- ============================================================================
-- USER CUSTOM FIELDS (Phase 4)
-- ============================================================================

CREATE TABLE user_game_custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES platforms(id),
    
    -- Time & Completion
    estimated_completion_hours REAL,
    actual_playtime_hours REAL,
    completion_percentage INTEGER CHECK(completion_percentage >= 0 AND completion_percentage <= 100),
    
    -- Difficulty (user's opinion)
    difficulty_rating INTEGER CHECK(difficulty_rating >= 1 AND difficulty_rating <= 10),
    
    -- Achievements (manual entry)
    achievements_total INTEGER,
    achievements_earned INTEGER,
    
    -- Personal Assessment
    replay_value INTEGER CHECK(replay_value >= 1 AND replay_value <= 5),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, game_id, platform_id)
);

CREATE INDEX idx_custom_fields_user_game ON user_game_custom_fields(user_id, game_id);

-- ============================================================================
-- SYNC HISTORY
-- ============================================================================

CREATE TABLE sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES platforms(id),
    sync_started TIMESTAMPTZ NOT NULL,
    sync_completed TIMESTAMPTZ,
    status VARCHAR(20) CHECK(status IN ('running', 'completed', 'failed')),
    games_synced INTEGER DEFAULT 0,
    achievements_synced INTEGER DEFAULT 0,
    error_message TEXT
);

CREATE INDEX idx_sync_history_user ON sync_history(user_id);
CREATE INDEX idx_sync_history_platform ON sync_history(platform_id);
