# Vercel AI Gateway Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable multi-provider AI model access (OpenAI + xAI) using Vercel AI SDK's provider registry to unlock grok-2-image-1212 for cover generation.

**Architecture:** Replace direct OpenAI client with provider registry that automatically routes model requests to the correct provider (OpenAI or xAI). Store encrypted API keys per provider in user_ai_settings table. Use `createProviderRegistry()` for centralized multi-provider access with model prefix routing (e.g., `openai:gpt-4o`, `xai:grok-2-image-1212`).

**Tech Stack:** Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/xai`), PostgreSQL, Drizzle ORM, encryption utilities

---

## Task 1: Install xAI SDK Package

**Files:**
- Modify: `backend/package.json`

**Step 1: Add @ai-sdk/xai dependency**

Run: `bun add @ai-sdk/xai`

Expected: Package installed and added to dependencies in package.json

**Step 2: Verify installation**

Run: `bun install`

Expected: Lock file updated, no errors

**Step 3: Verify TypeScript recognizes the package**

Run: `cd backend && bun run typecheck`

Expected: PASS (no new errors from missing types)

**Step 4: Commit**

```bash
git add package.json bun.lockb
git commit -m "feat: add xai sdk for multi-provider support"
```

---

## Task 2: Update Database Schema for xAI Provider

**Files:**
- Modify: `backend/src/db/schema.ts:670`
- Create: `backend/drizzle/0023_*.sql` (auto-generated)

**Step 1: Add xai to provider enum**

In `backend/src/db/schema.ts`, update line 670:

```typescript
export const aiProviderEnum = pgEnum("ai_provider", ["openai", "xai"]);
```

**Step 2: Add xAI-specific columns to userAiSettings**

After line 693 (enableSmartRouting), add:

```typescript
// xAI provider settings
xaiApiKeyEncrypted: text("xai_api_key_encrypted"),
xaiBaseUrl: text("xai_base_url"),
```

**Step 3: Generate migration**

Run: `cd backend && bun run db:generate`

Expected: New migration file created in `drizzle/` directory with enum update and column additions

**Step 4: Review generated SQL**

Run: `cat drizzle/0023_*.sql`

Expected output should include:
```sql
ALTER TYPE "ai_provider" ADD VALUE 'xai';
ALTER TABLE "user_ai_settings" ADD COLUMN "xai_api_key_encrypted" text;
ALTER TABLE "user_ai_settings" ADD COLUMN "xai_base_url" text;
```

**Step 5: Apply migration**

Run: `cd backend && bun run db:migrate`

Expected: Migration applied successfully

**Step 6: Verify schema update**

Run: `cd backend && bun run typecheck`

Expected: PASS

**Step 7: Commit**

```bash
git add src/db/schema.ts drizzle/0023_*.sql drizzle/meta/*
git commit -m "feat: add xai provider to database schema"
```

---

## Task 3: Create Provider Registry Service

**Files:**
- Create: `backend/src/services/ai/provider-registry.ts`

**Step 1: Create registry service file**

Create `backend/src/services/ai/provider-registry.ts`:

```typescript
import { createOpenAI } from "@ai-sdk/openai"
import { createXai } from "@ai-sdk/xai"
import { createProviderRegistry } from "ai"
import type { ProviderRegistry } from "ai"
import { decrypt } from "@/lib/encryption"
import type { AiSettings } from "./service"

export interface MultiProviderSettings {
  openai?: {
    apiKey: string
    baseUrl?: string
  }
  xai?: {
    apiKey: string
    baseUrl?: string
  }
}

export function createAIProviderRegistry(settings: MultiProviderSettings): ProviderRegistry {
  const providers: Record<string, any> = {}

  // Register OpenAI provider if credentials available
  if (settings.openai?.apiKey) {
    providers.openai = createOpenAI({
      apiKey: settings.openai.apiKey,
      baseURL: settings.openai.baseUrl || undefined,
    })
  }

  // Register xAI provider if credentials available
  if (settings.xai?.apiKey) {
    providers.xai = createXai({
      apiKey: settings.xai.apiKey,
      baseURL: settings.xai.baseUrl || undefined,
    })
  }

  if (Object.keys(providers).length === 0) {
    throw new Error("No AI providers configured")
  }

  return createProviderRegistry(providers)
}

export function buildMultiProviderSettings(
  openaiSettings: AiSettings | null,
  xaiSettings: AiSettings | null
): MultiProviderSettings {
  const settings: MultiProviderSettings = {}

  if (openaiSettings?.apiKeyEncrypted) {
    settings.openai = {
      apiKey: decrypt(openaiSettings.apiKeyEncrypted),
      baseUrl: openaiSettings.baseUrl || undefined,
    }
  }

  if (xaiSettings?.xaiApiKeyEncrypted) {
    settings.xai = {
      apiKey: decrypt(xaiSettings.xaiApiKeyEncrypted),
      baseUrl: xaiSettings.xaiBaseUrl || undefined,
    }
  }

  return settings
}
```

**Step 2: Verify TypeScript**

Run: `cd backend && bun run typecheck`

Expected: PASS

**Step 3: Verify linting**

Run: `cd backend && bun run lint`

Expected: PASS

**Step 4: Commit**

```bash
git add src/services/ai/provider-registry.ts
git commit -m "feat: create provider registry service for multi-provider support"
```

---

## Task 4: Update AI Service to Use Provider Registry

**Files:**
- Modify: `backend/src/services/ai/service.ts`

**Step 1: Add registry imports**

At top of `backend/src/services/ai/service.ts` (after existing imports), add:

```typescript
import type { ProviderRegistry } from "ai"
import {
  createAIProviderRegistry,
  buildMultiProviderSettings,
  type MultiProviderSettings,
} from "./provider-registry"
```

**Step 2: Add function to fetch all provider settings**

After `getUserAiSettings()` function (around line 90), add:

```typescript
async function getAllUserProviderSettings(
  userId: string
): Promise<{ openai: AiSettings | null; xai: AiSettings | null }> {
  const [openaiSettings, xaiSettings] = await Promise.all([
    queryOne<AiSettings>(
      `SELECT * FROM user_ai_settings WHERE user_id = $1 AND provider = 'openai'::ai_provider`,
      [userId]
    ),
    queryOne<AiSettings>(
      `SELECT * FROM user_ai_settings WHERE user_id = $1 AND provider = 'xai'::ai_provider`,
      [userId]
    ),
  ])

  return {
    openai: openaiSettings,
    xai: xaiSettings,
  }
}
```

**Step 3: Replace createVercelAIClient function**

Replace the existing `createVercelAIClient` function (lines 111-122) with:

```typescript
function createVercelAIProviderRegistry(settings: MultiProviderSettings): ProviderRegistry {
  return createAIProviderRegistry(settings)
}
```

**Step 4: Update suggestCollections to use registry**

In `suggestCollections()` function, replace lines 236-241:

```typescript
// OLD:
const settings = await getUserAiSettings(userId)
if (!settings || !settings.isActive) {
  throw new Error("AI features not configured")
}

// NEW:
const providerSettings = await getAllUserProviderSettings(userId)
const openaiSettings = providerSettings.openai

if (!openaiSettings || !openaiSettings.isActive) {
  throw new Error("AI features not configured")
}

const multiProviderSettings = buildMultiProviderSettings(
  providerSettings.openai,
  providerSettings.xai
)
const registry = createVercelAIProviderRegistry(multiProviderSettings)
```

**Step 5: Update model selection to use registry**

In `suggestCollections()`, replace lines 242-250:

```typescript
// OLD:
// Get available models
const availableModels = await getAvailableModels(settings)

// Select optimal model for this task
const modelSelection = await selectModelForTask("suggest_collections", settings, availableModels)

// NEW:
// Get available models from all providers
const availableModels = await getAvailableModelsFromRegistry(registry, multiProviderSettings)

// Select optimal model for this task
const modelSelection = await selectModelForTask(
  "suggest_collections",
  openaiSettings,
  availableModels
)
```

**Step 6: Update generateText call to use registry model**

In `suggestCollections()`, replace line 305 (and similar lines in the conditional):

```typescript
// OLD:
model: vercelClient(modelSelection.model),

// NEW:
model: registry.languageModel(addProviderPrefix(modelSelection.model)),
```

**Step 7: Add helper function for provider prefixes**

After `buildMultiProviderSettings()` imports at top, add:

```typescript
function addProviderPrefix(model: string): string {
  // xAI models
  if (model.startsWith("grok-")) {
    return `xai:${model}`
  }
  // OpenAI models (default)
  return `openai:${model}`
}
```

**Step 8: Create getAvailableModelsFromRegistry function**

Replace `getAvailableModels()` function (lines 124-133) with:

```typescript
async function getAvailableModelsFromRegistry(
  registry: ProviderRegistry,
  settings: MultiProviderSettings
): Promise<string[]> {
  const allModels: string[] = []

  try {
    // Get OpenAI models if configured
    if (settings.openai?.apiKey) {
      const openaiClient = createOpenAI({
        apiKey: settings.openai.apiKey,
        baseURL: settings.openai.baseUrl || undefined,
      })
      const openaiModels = await discoverOpenAIModels(openaiClient)
      allModels.push(
        ...openaiModels.textModels.map((m) => m.id),
        ...openaiModels.imageModels.map((m) => m.id)
      )
    }

    // Get xAI models if configured
    if (settings.xai?.apiKey) {
      // xAI models are known (not discoverable via API)
      allModels.push(
        "grok-beta",
        "grok-vision-beta",
        "grok-2-image-1212",
        "grok-code-fast-1"
      )
    }

    return allModels
  } catch (error) {
    console.error("Failed to discover available models:", error)
    return []
  }
}
```

**Step 9: Apply same changes to suggestNextGame**

In `suggestNextGame()` function (lines 380-521), apply the same pattern:
- Replace `getUserAiSettings` with `getAllUserProviderSettings` + `buildMultiProviderSettings`
- Update `getAvailableModels` call to `getAvailableModelsFromRegistry`
- Update model reference to use `registry.languageModel(addProviderPrefix(...))`
- Update all `settings` references to `openaiSettings` where appropriate

**Step 10: Apply same changes to generateCollectionCover**

In `generateCollectionCover()` function (lines 523-617), apply the same pattern as Steps 4-6.

**Step 11: Verify TypeScript**

Run: `cd backend && bun run typecheck`

Expected: PASS

**Step 12: Verify linting**

Run: `cd backend && bun run lint`

Expected: PASS

**Step 13: Commit**

```bash
git add src/services/ai/service.ts
git commit -m "feat: integrate provider registry for multi-provider model access"
```

---

## Task 5: Add API Endpoints for xAI Settings Management

**Files:**
- Modify: `backend/src/routes/ai.ts`

**Step 1: Add GET endpoint for xAI settings**

In `backend/src/routes/ai.ts`, after the existing `/api/ai/settings` GET endpoint (around line 120), add:

```typescript
router.get(
  "/api/ai/settings/xai",
  requireAuth(async (req, user) => {
    const settings = await queryOne<{
      xai_api_key_encrypted: string | null
      xai_base_url: string | null
    }>(
      `SELECT xai_api_key_encrypted, xai_base_url
       FROM user_ai_settings
       WHERE user_id = $1 AND provider = 'openai'::ai_provider`,
      [user.id]
    )

    return new Response(
      JSON.stringify({
        hasApiKey: !!settings?.xai_api_key_encrypted,
        baseUrl: settings?.xai_base_url || null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    )
  })
)
```

**Step 2: Add PUT endpoint for xAI credentials**

After the GET endpoint from Step 1, add:

```typescript
router.put(
  "/api/ai/settings/xai",
  requireAuth(async (req, user) => {
    const body = await req.json()
    const { apiKey, baseUrl } = body

    if (!apiKey || typeof apiKey !== "string") {
      return new Response(JSON.stringify({ error: "API key is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      })
    }

    const apiKeyEncrypted = encrypt(apiKey)

    await query(
      `UPDATE user_ai_settings
       SET xai_api_key_encrypted = $1,
           xai_base_url = $2,
           updated_at = NOW()
       WHERE user_id = $3 AND provider = 'openai'::ai_provider`,
      [apiKeyEncrypted, baseUrl || null, user.id]
    )

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    })
  })
)
```

**Step 3: Add DELETE endpoint for xAI credentials**

After the PUT endpoint from Step 2, add:

```typescript
router.delete(
  "/api/ai/settings/xai",
  requireAuth(async (req, user) => {
    await query(
      `UPDATE user_ai_settings
       SET xai_api_key_encrypted = NULL,
           xai_base_url = NULL,
           updated_at = NOW()
       WHERE user_id = $3 AND provider = 'openai'::ai_provider`,
      [user.id]
    )

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    })
  })
)
```

**Step 4: Verify TypeScript**

Run: `cd backend && bun run typecheck`

Expected: PASS

**Step 5: Verify linting**

Run: `cd backend && bun run lint`

Expected: PASS

**Step 6: Commit**

```bash
git add src/routes/ai.ts
git commit -m "feat: add api endpoints for xai credentials management"
```

---

## Task 6: Manual Verification and Testing

**Files:**
- None (manual testing)

**Step 1: Start backend server**

Run: `cd backend && bun run dev`

Expected: Server starts on port 3000, migrations run automatically

**Step 2: Verify database schema**

Run: `psql postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard`

Execute:
```sql
\d user_ai_settings
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'user_ai_settings'
AND column_name IN ('xai_api_key_encrypted', 'xai_base_url');
```

Expected: Both columns exist with type 'text'

**Step 3: Test xAI settings endpoint (GET)**

Run:
```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
  http://localhost:3000/api/ai/settings/xai
```

Expected: Returns `{ "hasApiKey": false, "baseUrl": null }`

**Step 4: Test xAI settings endpoint (PUT)**

Run:
```bash
curl -X PUT \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "xai-test-key", "baseUrl": "https://api.x.ai/v1"}' \
  http://localhost:3000/api/ai/settings/xai
```

Expected: Returns `{ "success": true }`

**Step 5: Verify xAI credentials stored encrypted**

Run:
```sql
SELECT xai_api_key_encrypted, xai_base_url
FROM user_ai_settings
WHERE user_id = '<your-user-id>';
```

Expected: `xai_api_key_encrypted` is encrypted (not plain text), `xai_base_url` is `https://api.x.ai/v1`

**Step 6: Test provider registry with grok-2-image-1212**

Make a collection cover generation request with smart routing enabled. The model router should select grok-2-image-1212 as primary image model.

Run:
```bash
curl -X POST \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "collectionId": "<test-collection-id>",
    "name": "Test Collection",
    "description": "A test collection for verification"
  }' \
  http://localhost:3000/api/ai/collections/generate-cover
```

Expected: Cover generated successfully using grok-2-image-1212 model

**Step 7: Verify activity log shows correct model**

Run:
```sql
SELECT action, model, cost_cents, success
FROM ai_activity_logs
WHERE user_id = '<your-user-id>'
ORDER BY created_at DESC
LIMIT 1;
```

Expected: `model` = 'grok-2-image-1212', `success` = true, `cost_cents` = 7 (for $0.07)

**Step 8: Test fallback to OpenAI models**

Remove xAI credentials (DELETE endpoint), then repeat Step 6.

Expected: Falls back to gpt-image-1.5 or dall-e-3 (secondary image models in fallback chain)

**Step 9: Document test results**

Create or update: `docs/testing/vercel-ai-gateway-verification.md`

Document:
- Database schema verified ✓
- xAI credentials API endpoints work ✓
- Provider registry correctly routes xAI models ✓
- Fallback to OpenAI works when xAI unavailable ✓
- Activity logs track correct model and costs ✓

**Step 10: Commit test documentation**

```bash
git add docs/testing/vercel-ai-gateway-verification.md
git commit -m "docs: add vercel ai gateway verification results"
```

---

## Success Criteria

- [ ] xAI SDK package installed
- [ ] Database schema updated with xai provider and credentials columns
- [ ] Provider registry service created
- [ ] AI service refactored to use multi-provider registry
- [ ] API endpoints for xAI settings management working
- [ ] Manual testing confirms grok-2-image-1212 accessible
- [ ] Fallback to OpenAI models works when xAI unavailable
- [ ] Activity logs track correct provider and model
- [ ] All TypeScript checks pass
- [ ] All lint checks pass

---

## Notes

### Provider Prefix Format

Models are accessed with provider prefixes:
- OpenAI: `openai:gpt-4o-mini`, `openai:dall-e-3`
- xAI: `xai:grok-2-image-1212`, `xai:grok-beta`

The `addProviderPrefix()` helper automatically adds the correct prefix based on model name patterns.

### xAI Model Discovery

Unlike OpenAI, xAI doesn't provide a model discovery API. We hardcode known xAI models in `getAvailableModelsFromRegistry()`:
- `grok-beta` - Text generation
- `grok-vision-beta` - Vision + text
- `grok-2-image-1212` - Image generation
- `grok-code-fast-1` - Code generation

### Credential Storage

xAI credentials are stored in the same `user_ai_settings` row as OpenAI credentials (where `provider = 'openai'`). This simplifies the schema and allows users to configure multiple providers without creating separate rows.

### Cost Tracking

The existing `MODEL_COSTS` constant already includes grok-2-image-1212 pricing ($0.07 per image). Activity logging will automatically track costs for xAI models.

### Error Handling

If both OpenAI and xAI credentials are missing, the provider registry throws "No AI providers configured" error. The API should handle this gracefully and prompt the user to configure at least one provider.
