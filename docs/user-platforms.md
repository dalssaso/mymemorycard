# User-Platforms Feature

## Overview

The user-platforms feature allows users to connect and manage their gaming platform accounts (Steam, PlayStation Network, Xbox Live, etc.) within MyMemoryCard. Each user can have multiple platform accounts with custom usernames, profile URLs, and notes.

## Architecture

The feature follows the DI (Dependency Injection) pattern with layered architecture:

- **Controllers** (`UserPlatformsController`) - Handle HTTP requests and responses
- **Services** (`UserPlatformsService`) - Business logic and validation
- **Repositories** (`UserPlatformsRepository`) - Database access
- **DTOs** - Data transfer objects with Zod schema validation

All endpoints are versioned under `/api/v1/user-platforms`.

## API Endpoints

### GET /api/v1/user-platforms

Retrieve all user-platforms for the authenticated user.

**Authentication:** Required (Bearer token)

**Request:**

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/user-platforms
```

**Response:** 200 OK

```json
{
  "user_platforms": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "660e8400-e29b-41d4-a716-446655440000",
      "platform_id": "770e8400-e29b-41d4-a716-446655440000",
      "username": "player123",
      "icon_url": "https://example.com/icon.png",
      "profile_url": "https://steamcommunity.com/profiles/player123",
      "notes": "Primary Steam account",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/v1/user-platforms

Add a new gaming platform to the user's account.

**Authentication:** Required (Bearer token)

**Request:**

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "platform_id": "770e8400-e29b-41d4-a716-446655440000",
    "username": "newplayer",
    "icon_url": "https://example.com/icon.png",
    "profile_url": "https://steamcommunity.com/profiles/newplayer",
    "notes": "My new account"
  }' \
  http://localhost:3000/api/v1/user-platforms
```

**Response:** 201 Created

```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440000",
  "platform_id": "770e8400-e29b-41d4-a716-446655440000",
  "username": "newplayer",
  "icon_url": "https://example.com/icon.png",
  "profile_url": "https://steamcommunity.com/profiles/newplayer",
  "notes": "My new account",
  "created_at": "2026-01-15T10:30:00Z"
}
```

### PATCH /api/v1/user-platforms/:id

Update user-platform details (username, profile URL, notes).

**Authentication:** Required (Bearer token)

**Request:**

```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "updated_username",
    "icon_url": "https://example.com/new-icon.png",
    "profile_url": "https://steamcommunity.com/profiles/updated_username",
    "notes": "Updated notes"
  }' \
  http://localhost:3000/api/v1/user-platforms/880e8400-e29b-41d4-a716-446655440000
```

**Response:** 200 OK

```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440000",
  "platform_id": "770e8400-e29b-41d4-a716-446655440000",
  "username": "updated_username",
  "icon_url": "https://example.com/new-icon.png",
  "profile_url": "https://steamcommunity.com/profiles/updated_username",
  "notes": "Updated notes",
  "created_at": "2026-01-15T10:30:00Z"
}
```

**Error Responses:**

- 401 Unauthorized - Missing or invalid authentication token
- 404 Not Found - User-platform not found or belongs to another user

### DELETE /api/v1/user-platforms/:id

Remove a gaming platform from the user's account.

**Authentication:** Required (Bearer token)

**Request:**

```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/user-platforms/880e8400-e29b-41d4-a716-446655440000
```

**Response:** 204 No Content

**Error Responses:**

- 401 Unauthorized - Missing or invalid authentication token
- 404 Not Found - User-platform not found or belongs to another user

## Request/Response Format

All request and response payloads use `snake_case` for field names (as per API standards).

### Common Request Fields

| Field         | Type   | Required | Description                           |
| ------------- | ------ | -------- | ------------------------------------- |
| `platform_id` | UUID   | Yes      | Reference to the gaming platform      |
| `username`    | string | No       | Username on the platform              |
| `icon_url`    | string | No       | URL to platform icon                  |
| `profile_url` | string | No       | URL to user's profile on the platform |
| `notes`       | string | No       | Custom notes about this account       |

### Common Response Fields

| Field         | Type     | Description                                    |
| ------------- | -------- | ---------------------------------------------- |
| `id`          | UUID     | Unique identifier for the user-platform record |
| `user_id`     | UUID     | Reference to the user who owns this record     |
| `platform_id` | UUID     | Reference to the gaming platform               |
| `created_at`  | ISO 8601 | Timestamp of when the record was created       |

## Error Handling

All errors return JSON with an error message:

```json
{
  "error": "Description of what went wrong"
}
```

**Status Codes:**

- `400 Bad Request` - Invalid request format (e.g., invalid UUID in path)
- `401 Unauthorized` - Authentication token missing or invalid
- `404 Not Found` - Resource not found or unauthorized access
- `500 Internal Server Error` - Server-side error

## Testing

Integration tests verify all CRUD operations and error cases:

```bash
# Run user-platforms integration tests
bun test tests/integration/features/user-platforms/

# Run all backend tests
bun test
```

Test coverage includes:

- Creating user-platforms with valid/invalid data
- Retrieving platforms for authenticated users
- Updating platform details with authorization checks
- Deleting platforms with ownership validation
- Proper HTTP status codes and error responses
- Authentication requirements on all endpoints

## Implementation Details

### Database Schema

The `user_platforms` table stores:

- Platform connection information
- User ownership validation
- Timestamps for creation

Foreign keys ensure referential integrity with `users` and `platforms` tables.

### Validation

Zod schemas validate:

- UUID format for path parameters and IDs
- Required vs optional fields
- String length constraints

### Authorization

All endpoints verify that:

- Requests include valid authentication tokens
- Users can only access their own platform records
- Updates and deletions are restricted to record owners

## Related Documentation

See the [architecture guidelines](./architecture/guidelines.md) for DI patterns and API standards.
