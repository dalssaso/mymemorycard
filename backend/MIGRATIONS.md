# Database Migrations

This document tracks all database schema changes and provides migration instructions.

## Migration Files

- `init.sql` - Initialization script (extensions only)
- `schema.sql` - Complete database schema (copied from docs/schema.sql)
- Docker automatically runs these in order: `01-init.sql`, then `02-schema.sql`

## Fresh Installation

For a new deployment:

```bash
docker-compose up -d postgres
```

The database will be automatically initialized with the complete schema.

## Migration History

### Phase 6: Favorites System (2025-12-28)

**Changes:**
- Added `is_favorite BOOLEAN DEFAULT FALSE` to `user_game_progress` table
- Added index: `idx_user_favorites` (partial index on favorites)

**Migration SQL:**
```sql
ALTER TABLE user_game_progress ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_user_favorites ON user_game_progress(user_id, is_favorite) WHERE is_favorite = TRUE;
```

### Phase 4: Custom User Fields (2025-12-28)

**Changes:**
- Created new table `user_game_custom_fields` for user-defined game statistics

**Migration SQL:**
```sql
CREATE TABLE IF NOT EXISTS user_game_custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES platforms(id),
    estimated_completion_hours REAL,
    actual_playtime_hours REAL,
    completion_percentage INTEGER CHECK(completion_percentage >= 0 AND completion_percentage <= 100),
    difficulty_rating INTEGER CHECK(difficulty_rating >= 1 AND difficulty_rating <= 10),
    achievements_total INTEGER,
    achievements_earned INTEGER,
    replay_value INTEGER CHECK(replay_value >= 1 AND replay_value <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, game_id, platform_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_user_game ON user_game_custom_fields(user_id, game_id);
```

## Manual Migration (Existing Database)

If you have an existing database and need to apply new migrations:

```bash
# Connect to the database
docker exec -it gamelist-db psql -U gamelist -d gamelist

# Run the migration SQL from the appropriate section above
```

Or use the migration script:

```bash
# Apply all missing migrations
docker exec -i gamelist-db psql -U gamelist -d gamelist < backend/migrations/YYYYMMDD_description.sql
```

## Rollback

To start fresh (⚠️ WARNING: This deletes all data):

```bash
# Stop and remove containers
docker-compose down

# Remove the database volume
docker volume rm gamelist_postgres_data

# Start fresh
docker-compose up -d
```

## Verifying Migrations

Check if a table exists:
```sql
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_game_custom_fields'
);
```

Check if a column exists:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_game_progress' 
AND column_name = 'is_favorite';
```

List all indexes:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'user_game_progress';
```
