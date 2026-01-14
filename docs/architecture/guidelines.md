# Architecture Guidelines

## Scope

These guidelines cover DI-backed HTTP routes, API versioning, OpenAPI generation, and
frontend usage expectations.

## DI + Hono Routing

- Use DI controllers with Hono (`OpenAPIHono`) for all new routes.
- Wire DI routes under `/api/v1` in `createHonoApp`.
- Keep legacy `/api` routes intact until migration is complete.

## API Versioning

- New endpoints must live under `/api/v1`.
- Legacy endpoints remain under `/api` and are removed only after migration.

## JSON Casing

- All request and response payloads use `snake_case`.
- Query parameters use `snake_case`.
- Error payloads use `snake_case` (for example, `request_id`).

## OpenAPI + Frontend Codegen

- Generate OpenAPI from the DI Hono app.
- `backend/openapi.json` is the committed source of truth.
- Generate the frontend client from `backend/openapi.json` and commit output.

Commands:

```bash
cd backend && bun run generate:openapi
cd frontend && npm run generate:api
```

## Frontend Boundaries

- Use the generated client for `/api/v1` endpoints.
- Keep adapters at the API layer only; components and hooks should consume
  `snake_case` fields.

## Testing Expectations

- Unit tests for new DI route behavior and OpenAPI output.
- Integration tests for versioned endpoints.
- Frontend unit tests for API client usage and auth flows.
