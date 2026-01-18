# Steam and RetroAchievements Integration

This document describes the Steam and RetroAchievements integration for MyMemoryCard, enabling achievement tracking from external sources.

## Overview

The integration provides:

1. **Steam Integration** - Link Steam accounts, import game libraries, and sync achievement progress
2. **RetroAchievements Integration** - Track achievements for retro games via the RetroAchievements platform
3. **Unified Achievement System** - Priority-based achievement fetching with caching

## Architecture

### Priority Chain

Achievements are fetched using a priority chain:

1. **Steam** - If the game has a `steam_app_id`, try Steam first
2. **RetroAchievements** - If the game has a `retro_game_id`, try RA second
3. **Cached/Manual** - Fall back to cached achievements or manual entries

### Database Schema

#### Games Table Extensions

```sql
steam_app_id    INTEGER     -- Steam App ID for the game
retro_game_id   INTEGER     -- RetroAchievements game ID
```

#### Achievements Table

```sql
achievements (
  id              UUID PRIMARY KEY
  game_id         UUID REFERENCES games(id)
  platform_id     UUID REFERENCES platforms(id)
  achievement_id  TEXT        -- External achievement ID
  name            TEXT
  description     TEXT
  icon_url        TEXT
  rarity_percentage DECIMAL
  points          INTEGER     -- RA points only
  source_api      source_api_enum  -- steam, retroachievements, rawg, manual
  external_id     TEXT
)
```

#### User Achievements Table

```sql
user_achievements (
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES users(id)
  achievement_id  UUID REFERENCES achievements(id)
  unlocked        BOOLEAN
  unlock_date     TIMESTAMP
)
```

## API Endpoints

### Steam Integration

| Method | Path                     | Description                  |
| ------ | ------------------------ | ---------------------------- |
| GET    | `/api/v1/steam/connect`  | Get Steam OpenID login URL   |
| GET    | `/api/v1/steam/callback` | Handle Steam OpenID callback |
| GET    | `/api/v1/steam/library`  | Import Steam library games   |
| POST   | `/api/v1/steam/sync`     | Sync achievements for a game |

### RetroAchievements Integration

| Method | Path                                    | Description                  |
| ------ | --------------------------------------- | ---------------------------- |
| POST   | `/api/v1/retroachievements/credentials` | Save RA credentials          |
| POST   | `/api/v1/retroachievements/validate`    | Validate RA credentials      |
| POST   | `/api/v1/retroachievements/sync`        | Sync achievements for a game |

### Achievements

| Method | Path                                    | Description                       |
| ------ | --------------------------------------- | --------------------------------- |
| GET    | `/api/v1/achievements/:gameId`          | Get achievements (priority chain) |
| GET    | `/api/v1/achievements/:gameId/progress` | Get achievement progress          |
| POST   | `/api/v1/achievements/:gameId/sync`     | Sync from specific source         |

## Environment Variables

### Steam

| Variable        | Default  | Description                                     |
| --------------- | -------- | ----------------------------------------------- |
| `STEAM_API_KEY` | required | Steam Web API key (required for library import) |

### RetroAchievements

RetroAchievements uses per-user credentials stored encrypted in the database. Users provide:

- `username` - RetroAchievements username
- `api_key` - RetroAchievements API key

## Credential Storage

All external API credentials are:

1. Encrypted at rest using AES-256-GCM
2. Stored in the `user_api_credentials` table
3. Scoped to individual users
4. Never returned in API responses

## Implementation Files

### Steam Integration

```text
backend/src/integrations/steam/
  steam.types.ts              # Steam API types
  steam.service.interface.ts  # Service interface
  steam.service.ts            # Service implementation
  steam.controller.ts         # API controller
  steam.dto.ts                # Request/Response DTOs
  index.ts                    # Barrel export
```

### RetroAchievements Integration

```text
backend/src/integrations/retroachievements/
  retroachievements.types.ts              # RA API types
  retroachievements.service.interface.ts  # Service interface
  retroachievements.service.ts            # Service implementation
  retroachievements.controller.ts         # API controller
  retroachievements.dto.ts                # Request/Response DTOs
  index.ts                                # Barrel export
```

### Achievements Feature

```text
backend/src/features/achievements/
  types.ts                                # Shared NormalizedAchievement type
  repositories/
    achievement.repository.interface.ts   # Repository interface
    achievement.repository.ts             # Repository implementation
  services/
    achievement.service.interface.ts      # Service interface
    achievement.service.ts                # Service implementation
  controllers/
    achievement.controller.interface.ts   # Controller interface
    achievement.controller.ts             # Controller implementation
  dtos/
    achievement.dto.ts                    # Request/Response DTOs
```

## Testing

### Unit Tests

- `steam.service.test.ts` - Steam service unit tests
- `steam.controller.test.ts` - Steam controller unit tests

### Integration Tests

- `steam.integration.test.ts` - Steam API integration tests
- `retroachievements.integration.test.ts` - RA API integration tests
- `achievements.integration.test.ts` - Achievement API integration tests

## Security Considerations

1. **Credential Encryption** - All API keys are encrypted before storage
2. **User Isolation** - Users can only access their own credentials and achievements
3. **404 for Cross-User Access** - Returns 404 (not 403) to prevent resource enumeration
4. **Token Validation** - All endpoints require valid JWT authentication

## Future Enhancements

1. **RAWG Integration** - Add RAWG as a fallback achievement source
2. **Achievement Notifications** - Push notifications for new unlocks
3. **Achievement Statistics** - Global completion rates and leaderboards
4. **Batch Sync** - Sync achievements for all games in one operation
