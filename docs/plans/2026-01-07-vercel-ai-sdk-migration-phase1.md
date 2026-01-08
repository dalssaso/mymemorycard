# Vercel AI SDK Migration - Phase 1: SDK Replacement

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace OpenAI SDK with Vercel AI SDK while maintaining identical behavior (zero breaking changes).

**Architecture:** Direct SDK swap with API-compatible abstractions. Keep all existing prompts, response formats, and cost tracking logic. Vercel AI SDK's `generateText()` replaces OpenAI's `chat.completions.create()`.

**Tech Stack:** Vercel AI SDK (`ai`, `@ai-sdk/openai`), Bun runtime, TypeScript

---

## Task 1: Baseline Verification

**Files:**
- Read: `backend/src/services/ai/service.ts`
- Read: `backend/src/services/ai/models.ts`
- Read: `backend/package.json`

**Step 1: Document current OpenAI SDK usage**

Run: `cd backend && grep -n "import.*openai" src/services/ai/*.ts`

Expected output:
```
src/services/ai/service.ts:1:import OpenAI from "openai";
src/services/ai/models.ts:1:import type OpenAI from "openai";
```

**Step 2: Document current function signatures**

Run: `cd backend && grep -n "export async function" src/services/ai/service.ts`

Expected: Lines showing `suggestCollections`, `suggestNextGame`, `generateCollectionCover`, `getActivityLogs`, `estimateCost`

**Step 3: Verify typecheck passes on current code**

Run: `cd backend && bun run typecheck`

Expected: `✓ No errors found`

**Step 4: Verify lint passes on current code**

Run: `cd backend && bun run lint`

Expected: `✓ No linting errors`

**Step 5: Document current dependencies**

Run: `cd backend && grep -A2 '"openai"' package.json`

Expected output:
```json
"openai": "^6.15.0",
```

---

## Task 2: Install Vercel AI SDK

**Files:**
- Modify: `backend/package.json`

**Step 1: Add Vercel AI SDK dependencies**

```bash
cd backend
bun add ai @ai-sdk/openai
```

Expected: Dependencies added to package.json

**Step 2: Verify installation**

Run: `cd backend && grep -E '"(ai|@ai-sdk/openai)"' package.json`

Expected output:
```json
"ai": "^4.0.0",
"@ai-sdk/openai": "^1.0.0",
```

**Step 3: Verify typecheck still passes**

Run: `cd backend && bun run typecheck`

Expected: `✓ No errors found`

**Step 4: Commit dependency addition**

```bash
cd backend
git add package.json bun.lockb
git commit -m "chore: add vercel ai sdk dependencies"
```

---

## Task 3: Create Vercel AI Client Factory

**Files:**
- Modify: `backend/src/services/ai/service.ts:1-100`

**Step 1: Add Vercel AI SDK imports (keep OpenAI for now)**

In `backend/src/services/ai/service.ts` at line 1, add:

```typescript
import OpenAI from "openai"; // Keep temporarily
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
```

**Step 2: Create new client factory function**

After the `createImageClient` function (around line 124), add:

```typescript
function createVercelAIClient(settings: AiSettings) {
  if (!settings.apiKeyEncrypted) {
    throw new Error("API key not configured")
  }

  const apiKey = decrypt(settings.apiKeyEncrypted)

  return createOpenAI({
    apiKey,
    baseURL: settings.baseUrl || undefined,
  })
}
```

**Step 3: Verify typecheck passes**

Run: `cd backend && bun run typecheck`

Expected: `✓ No errors found`

**Step 4: Verify lint passes**

Run: `cd backend && bun run lint`

Expected: `✓ No linting errors`

**Step 5: Commit client factory**

```bash
cd backend
git add src/services/ai/service.ts
git commit -m "feat: add vercel ai sdk client factory"
```

---

## Task 4: Refactor suggestCollections - Part 1 (Setup)

**Files:**
- Modify: `backend/src/services/ai/service.ts:226-341`

**Step 1: Update suggestCollections to use both clients**

In `suggestCollections` function (line 226), after creating the OpenAI client, add:

```typescript
const client = createOpenAIClient(settings)
const vercelClient = createVercelAIClient(settings) // NEW
```

**Step 2: Verify typecheck passes**

Run: `cd backend && bun run typecheck`

Expected: `✓ No errors found`

**Step 3: Verify lint passes**

Run: `cd backend && bun run lint`

Expected: `✓ No linting errors`

**Step 4: Commit setup**

```bash
cd backend
git add src/services/ai/service.ts
git commit -m "refactor: add vercel client to suggestCollections"
```

---

## Task 5: Refactor suggestCollections - Part 2 (API Call)

**Files:**
- Modify: `backend/src/services/ai/service.ts:244-293`

**Step 1: Replace OpenAI completion call with Vercel AI SDK**

Replace the completion logic (lines 244-293) with:

```typescript
try {
  const completionParams: Record<string, unknown> = {
    model: vercelClient(settings.model),
    messages: [
      { role: "system", content: SYSTEM_PROMPTS.organizer },
      { role: "user", content: buildCollectionSuggestionsPrompt(library, theme) },
    ],
  }

  // Use max_completion_tokens for newer models
  completionParams.maxTokens = settings.maxTokens
  completionParams.responseFormat = { type: "json_object" }

  // Only set temperature for non-reasoning models
  if (
    !settings.model.startsWith("gpt-5") &&
    !settings.model.includes("o1") &&
    !settings.model.includes("o3")
  ) {
    completionParams.temperature = settings.temperature
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic params for multiple AI providers
  const result = await generateText(completionParams as any)

  const content = result.text

  // Check if we hit token limit
  if (result.finishReason === "length") {
    console.warn("Response was truncated due to max_tokens limit")
    throw new Error(
      "Response truncated - increase max_tokens to at least 12000 for reasoning models"
    )
  }

  if (!content) {
    console.error("No content in response. Full result:", result)
    throw new Error("No response from AI")
  }

  const parsed = JSON.parse(content) as { collections: Omit<CollectionSuggestion, "gameIds">[] }

  // Map game names to IDs using the library we already fetched
  const collectionsWithIds: CollectionSuggestion[] = parsed.collections.map((suggestion) => {
    const gameIds = suggestion.gameNames
      .map((name) => library.find((g) => g.name === name)?.id)
      .filter((id): id is string => id !== undefined)
    return { ...suggestion, gameIds }
  })

  const usage: TokenUsage = {
    promptTokens: result.usage?.inputTokens ?? 0,
    completionTokens: result.usage?.outputTokens ?? 0,
    totalTokens: result.usage?.totalTokens ?? 0,
  }
  const cost = calculateCost(settings.model, usage)

  await logActivity(
    userId,
    "suggest_collections",
    settings.provider,
    settings.model,
    usage,
    Date.now() - startTime,
    true,
    null,
    null,
    theme ?? null
  )

  return { collections: collectionsWithIds, cost }
```

**Step 2: Remove old OpenAI client usage**

Remove the line creating `client` variable (keep only `vercelClient`)

**Step 3: Verify typecheck passes**

Run: `cd backend && bun run typecheck`

Expected: `✓ No errors found`

**Step 4: Verify lint passes**

Run: `cd backend && bun run lint`

Expected: `✓ No linting errors`

**Step 5: Commit API call refactor**

```bash
cd backend
git add src/services/ai/service.ts
git commit -m "refactor: use vercel ai sdk in suggestCollections"
```

---

## Task 6: Refactor suggestNextGame

**Files:**
- Modify: `backend/src/services/ai/service.ts:343-449`

**Step 1: Update client creation**

In `suggestNextGame` function (line 343), replace:

```typescript
const client = createOpenAIClient(settings)
```

With:

```typescript
const client = createVercelAIClient(settings)
```

**Step 2: Replace completion call**

Replace the completion logic (lines 361-410) with:

```typescript
try {
  const completionParams: Record<string, unknown> = {
    model: client(settings.model),
    messages: [
      { role: "system", content: SYSTEM_PROMPTS.curator },
      { role: "user", content: buildNextGameSuggestionPrompt(library, userInput) },
    ],
  }

  // Use max_completion_tokens for newer models
  completionParams.maxTokens = settings.maxTokens
  completionParams.responseFormat = { type: "json_object" }

  // Only set temperature for non-reasoning models
  if (
    !settings.model.startsWith("gpt-5") &&
    !settings.model.includes("o1") &&
    !settings.model.includes("o3")
  ) {
    completionParams.temperature = settings.temperature
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic params for multiple AI providers
  const result = await generateText(completionParams as any)

  const content = result.text

  // Check if we hit token limit
  if (result.finishReason === "length") {
    console.warn("Response was truncated due to max_tokens limit")
    throw new Error(
      "Response truncated - increase max_tokens to at least 12000 for reasoning models"
    )
  }

  if (!content) {
    console.error("No content in next game response. Full result:", result)
    throw new Error("No response from AI")
  }

  const suggestion = JSON.parse(content) as NextGameSuggestion

  const usage: TokenUsage = {
    promptTokens: result.usage?.inputTokens ?? 0,
    completionTokens: result.usage?.outputTokens ?? 0,
    totalTokens: result.usage?.totalTokens ?? 0,
  }
  const cost = calculateCost(settings.model, usage)

  await logActivity(
    userId,
    "suggest_next_game",
    settings.provider,
    settings.model,
    usage,
    Date.now() - startTime,
    true,
    null,
    null,
    userInput ?? null
  )

  return { suggestion, cost }
```

**Step 3: Verify typecheck passes**

Run: `cd backend && bun run typecheck`

Expected: `✓ No errors found`

**Step 4: Verify lint passes**

Run: `cd backend && bun run lint`

Expected: `✓ No linting errors`

**Step 5: Commit next game refactor**

```bash
cd backend
git add src/services/ai/service.ts
git commit -m "refactor: use vercel ai sdk in suggestNextGame"
```

---

## Task 7: Refactor generateCollectionCover - Part 1 (Client)

**Files:**
- Modify: `backend/src/services/ai/service.ts:451-543`

**Step 1: Update image client to use Vercel AI SDK**

In `createImageClient` function (line 102), update to:

```typescript
function createImageClient(settings: AiSettings): { client: ReturnType<typeof createOpenAI>; provider: string } {
  const apiKey = settings.imageApiKeyEncrypted
    ? decrypt(settings.imageApiKeyEncrypted)
    : settings.apiKeyEncrypted
      ? decrypt(settings.apiKeyEncrypted)
      : null

  if (!apiKey) {
    throw new Error("Image API key not configured")
  }

  const client = createOpenAI({
    apiKey,
    baseURL: settings.baseUrl || undefined,
  })

  return {
    client,
    provider: "openai",
  }
}
```

**Step 2: Verify typecheck passes**

Run: `cd backend && bun run typecheck`

Expected: `✓ No errors found`

**Step 3: Verify lint passes**

Run: `cd backend && bun run lint`

Expected: `✓ No linting errors`

**Step 4: Commit image client update**

```bash
cd backend
git add src/services/ai/service.ts
git commit -m "refactor: update image client to vercel ai sdk"
```

---

## Task 8: Refactor generateCollectionCover - Part 2 (Image Generation)

**Files:**
- Modify: `backend/src/services/ai/service.ts:451-543`

**Step 1: Update to use Vercel AI SDK image generation**

Replace the image generation logic (lines 472-509) with:

```typescript
try {
  // Build image generation params based on model type
  const imageParams: Record<string, unknown> = {
    model: client(model),
    prompt: buildCoverImagePrompt(collectionName, collectionDescription),
    n: 1,
    size,
    moderation: "low", // Less restrictive content filtering for game-related prompts
  }

  if (isGptImageModel) {
    // gpt-image models use output_format instead of quality
    imageParams.output_format = "png"
  } else {
    // DALL-E models support quality parameter
    imageParams.quality = "medium" // Options: 'low', 'medium', 'high', 'auto'
  }

  // Note: Vercel AI SDK doesn't have a dedicated image generation API yet
  // We'll use the OpenAI client directly through the Vercel wrapper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic params for multiple image providers
  const response = await client.images.generate(imageParams as any)

  if (!response.data || response.data.length === 0) {
    throw new Error("No image data in response")
  }

  // Handle both URL and base64 response formats
  const urlResponse = response.data[0]?.url
  const b64Response = response.data[0]?.b64_json

  let imageUrl: string
  if (urlResponse) {
    imageUrl = urlResponse
  } else if (b64Response) {
    // Convert base64 to data URL for gpt-image models
    imageUrl = `data:image/png;base64,${b64Response}`
  } else {
    throw new Error("No image data in response (neither URL nor base64)")
  }

  const usage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  const cost = calculateCost(model, usage)

  await logActivity(
    userId,
    "generate_cover_image",
    "openai",
    model,
    usage,
    Date.now() - startTime,
    true,
    null,
    collectionId,
    `${collectionName}: ${collectionDescription}`
  )

  return { imageUrl, cost }
```

**Step 2: Verify typecheck passes**

Run: `cd backend && bun run typecheck`

Expected: `✓ No errors found`

**Step 3: Verify lint passes**

Run: `cd backend && bun run lint`

Expected: `✓ No linting errors`

**Step 4: Commit image generation refactor**

```bash
cd backend
git add src/services/ai/service.ts
git commit -m "refactor: use vercel ai sdk for image generation"
```

---

## Task 9: Remove Old OpenAI SDK Import

**Files:**
- Modify: `backend/src/services/ai/service.ts:1`
- Modify: `backend/src/services/ai/models.ts:1`

**Step 1: Remove OpenAI import from service.ts**

In `backend/src/services/ai/service.ts` line 1, remove:

```typescript
import OpenAI from "openai";
```

Keep only:

```typescript
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
```

**Step 2: Update models.ts import**

In `backend/src/services/ai/models.ts` line 1, replace:

```typescript
import type OpenAI from "openai";
```

With:

```typescript
import type { createOpenAI } from '@ai-sdk/openai'
```

**Step 3: Verify typecheck passes**

Run: `cd backend && bun run typecheck`

Expected: `✓ No errors found`

**Step 4: Verify lint passes**

Run: `cd backend && bun run lint`

Expected: `✓ No linting errors`

**Step 5: Commit import cleanup**

```bash
cd backend
git add src/services/ai/service.ts src/services/ai/models.ts
git commit -m "refactor: remove old openai sdk imports"
```

---

## Task 10: Update Model Discovery

**Files:**
- Modify: `backend/src/services/ai/models.ts:39-94`

**Step 1: Update function signature**

In `backend/src/services/ai/models.ts`, update `discoverOpenAIModels` signature (line 39):

```typescript
export async function discoverOpenAIModels(client: ReturnType<typeof createOpenAI>): Promise<ModelsResponse> {
```

**Step 2: Remove model listing API call**

Replace the implementation (lines 40-89) with hardcoded model list:

```typescript
export async function discoverOpenAIModels(client: ReturnType<typeof createOpenAI>): Promise<ModelsResponse> {
  // Vercel AI SDK doesn't expose models.list(), use hardcoded list instead
  // This is more reliable as model availability can be checked via API on demand

  const textModels: ModelCapability[] = []
  const imageModels: ModelCapability[] = []

  for (const modelId of OPENAI_TEXT_MODEL_RANKING) {
    const pricing = OPENAI_MODEL_PRICING[modelId]
    if (pricing) {
      textModels.push({
        id: modelId,
        name: modelId,
        displayName: modelId,
        pricing: {
          input: pricing.input,
          output: pricing.output,
        },
        capabilities: ["text"],
        provider: "openai",
      })
    }
  }

  for (const modelId of OPENAI_IMAGE_MODELS) {
    const pricing = OPENAI_IMAGE_MODEL_PRICING[modelId]
    if (pricing) {
      imageModels.push({
        id: modelId,
        name: modelId,
        displayName: modelId,
        pricing: {
          perImage: pricing.perImage,
        },
        capabilities: ["image"],
        provider: "openai",
      })
    }
  }

  return {
    textModels: textModels.slice(0, 5),
    imageModels: imageModels.slice(0, 5),
  }
}
```

**Step 3: Update getModelsForProvider signature**

Update function signature (line 96):

```typescript
export async function getModelsForProvider(
  provider: string,
  client?: ReturnType<typeof createOpenAI>
): Promise<ModelsResponse> {
```

**Step 4: Verify typecheck passes**

Run: `cd backend && bun run typecheck`

Expected: `✓ No errors found`

**Step 5: Verify lint passes**

Run: `cd backend && bun run lint`

Expected: `✓ No linting errors`

**Step 6: Commit model discovery update**

```bash
cd backend
git add src/services/ai/models.ts
git commit -m "refactor: use hardcoded model list with vercel ai sdk"
```

---

## Task 11: Update AI Routes

**Files:**
- Modify: `backend/src/routes/ai.ts:95-120`

**Step 1: Update model listing endpoint to use Vercel client**

In `backend/src/routes/ai.ts`, update the `/api/ai/models/openai` route (around line 95):

```typescript
router.get(
  "/api/ai/models/openai",
  requireAuth(async (_req, _params, user) => {
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      })
    }

    try {
      const settings = await queryOne<{
        apiKeyEncrypted: string | null
        baseUrl: string | null
      }>(
        `SELECT api_key_encrypted as "apiKeyEncrypted", base_url as "baseUrl"
         FROM user_ai_settings
         WHERE user_id = $1 AND provider = 'openai' AND is_active = true`,
        [user.id]
      )

      if (!settings?.apiKeyEncrypted) {
        return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        })
      }

      const apiKey = decrypt(settings.apiKeyEncrypted)
      const client = createOpenAI({
        apiKey,
        baseURL: settings.baseUrl || undefined,
      })

      const cached = await getCachedModels("openai")
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        })
      }

      const models = await discoverOpenAIModels(client)
      await setCachedModels("openai", models)

      return new Response(JSON.stringify(models), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      })
    } catch (error) {
      console.error("Get models error:", error)
      return new Response(JSON.stringify({ error: "Failed to fetch models" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      })
    }
  })
)
```

**Step 2: Add Vercel AI SDK imports to routes file**

At the top of `backend/src/routes/ai.ts` (around line 1), add:

```typescript
import { createOpenAI } from '@ai-sdk/openai'
```

**Step 3: Verify typecheck passes**

Run: `cd backend && bun run typecheck`

Expected: `✓ No errors found`

**Step 4: Verify lint passes**

Run: `cd backend && bun run lint`

Expected: `✓ No linting errors`

**Step 5: Commit routes update**

```bash
cd backend
git add src/routes/ai.ts
git commit -m "refactor: update ai routes to use vercel ai sdk"
```

---

## Task 12: Remove OpenAI SDK Dependency

**Files:**
- Modify: `backend/package.json`

**Step 1: Remove OpenAI SDK**

Run:

```bash
cd backend
bun remove openai
```

Expected: `openai` removed from dependencies

**Step 2: Verify typecheck passes**

Run: `cd backend && bun run typecheck`

Expected: `✓ No errors found`

**Step 3: Verify lint passes**

Run: `cd backend && bun run lint`

Expected: `✓ No linting errors`

**Step 4: Commit dependency removal**

```bash
cd backend
git add package.json bun.lockb
git commit -m "chore: remove openai sdk dependency"
```

---

## Task 13: Manual Testing - Collection Suggestions

**Files:**
- Test: All AI endpoints

**Step 1: Start development server**

Run: `cd backend && bun run dev`

Expected: Server starts on port 3000

**Step 2: Test collection suggestions without theme**

```bash
curl -X POST http://localhost:3000/api/ai/suggest-collections \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: JSON response with 3-5 collection suggestions

**Step 3: Test collection suggestions with theme**

```bash
curl -X POST http://localhost:3000/api/ai/suggest-collections \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"theme":"action games"}'
```

Expected: JSON response with 3-5 collection suggestions themed around "action games"

**Step 4: Verify activity logs**

```bash
curl http://localhost:3000/api/ai/activity?limit=1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: JSON with latest activity log showing correct token counts and cost

**Step 5: Document test results**

Create file: `backend/test-results-phase1.md`

```markdown
# Phase 1 Test Results

## Collection Suggestions (No Theme)
- Status: PASS/FAIL
- Response time: Xs
- Token usage: X tokens
- Cost: $X

## Collection Suggestions (With Theme)
- Status: PASS/FAIL
- Response time: Xs
- Token usage: X tokens
- Cost: $X

## Activity Logging
- Status: PASS/FAIL
- Tokens logged correctly: YES/NO
- Cost calculated correctly: YES/NO
```

---

## Task 14: Manual Testing - Next Game Suggestions

**Files:**
- Test: Next game endpoint

**Step 1: Test next game suggestion without user input**

```bash
curl -X POST http://localhost:3000/api/ai/suggest-next-game \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: JSON response with game recommendation and reasoning

**Step 2: Test next game suggestion with user input**

```bash
curl -X POST http://localhost:3000/api/ai/suggest-next-game \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userInput":"something short and relaxing"}'
```

Expected: JSON response recommending a short, relaxing game

**Step 3: Verify activity logs**

```bash
curl http://localhost:3000/api/ai/activity?limit=1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: Latest log shows suggest_next_game action

**Step 4: Update test results**

Append to `backend/test-results-phase1.md`:

```markdown
## Next Game Suggestion (No Input)
- Status: PASS/FAIL
- Response time: Xs
- Token usage: X tokens
- Game suggested: [name]

## Next Game Suggestion (With Input)
- Status: PASS/FAIL
- Response time: Xs
- Token usage: X tokens
- Game suggested: [name]
- Reasoning quality: GOOD/POOR
```

---

## Task 15: Manual Testing - Cover Generation

**Files:**
- Test: Cover generation endpoint

**Step 1: Create test collection**

```bash
curl -X POST http://localhost:3000/api/collections \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Collection","description":"For testing cover generation"}'
```

Expected: JSON with new collection ID

**Step 2: Test cover generation**

```bash
curl -X POST http://localhost:3000/api/ai/generate-cover \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collectionId":"COLLECTION_ID_FROM_STEP1",
    "collectionName":"Test Collection",
    "collectionDescription":"For testing cover generation"
  }'
```

Expected: JSON response with imageUrl

**Step 3: Verify cover image exists**

Run: `ls -lh backend/uploads/collection-covers/`

Expected: New cover file created (*.webp)

**Step 4: Update test results**

Append to `backend/test-results-phase1.md`:

```markdown
## Cover Generation
- Status: PASS/FAIL
- Response time: Xs
- Image model used: [model name]
- Image file created: YES/NO
- Image file size: X KB
- Cost: $X
```

---

## Task 16: Manual Testing - Cost Tracking Verification

**Files:**
- Test: Cost calculation accuracy

**Step 1: Get baseline costs from activity logs**

```bash
curl http://localhost:3000/api/ai/activity?limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: JSON array with recent activities

**Step 2: Calculate expected costs manually**

For each activity:
- Model: gpt-4o-mini (input: $0.15/1M, output: $0.6/1M)
- Example: 2000 prompt tokens + 500 completion tokens
- Expected cost: (2000 * 0.15 + 500 * 0.6) / 1000000 = $0.0006

**Step 3: Compare actual vs expected costs**

Verify costs in activity logs match manual calculations (±$0.0001)

**Step 4: Update test results**

Append to `backend/test-results-phase1.md`:

```markdown
## Cost Tracking Accuracy
- Test 1 (Collection): Expected $X, Actual $Y, Diff: $Z
- Test 2 (Next Game): Expected $X, Actual $Y, Diff: $Z
- Test 3 (Cover): Expected $X, Actual $Y, Diff: $Z
- Overall accuracy: PASS/FAIL (within ±$0.0001)
```

---

## Task 17: Response Format Compatibility Check

**Files:**
- Test: Response format consistency

**Step 1: Compare collection response format**

Verify collection suggestions response has:
- `collections` array
- Each collection has: `name`, `description`, `gameNames`, `gameIds`, `reasoning`
- `cost` field at root level

**Step 2: Compare next game response format**

Verify next game response has:
- `suggestion` object with: `gameName`, `reasoning`, `estimatedHours`
- `cost` field at root level

**Step 3: Compare cover response format**

Verify cover generation response has:
- `imageUrl` field
- `cost` field

**Step 4: Document compatibility**

Append to `backend/test-results-phase1.md`:

```markdown
## Response Format Compatibility
- Collection suggestions: COMPATIBLE/INCOMPATIBLE
- Next game suggestions: COMPATIBLE/INCOMPATIBLE
- Cover generation: COMPATIBLE/INCOMPATIBLE
- Notes: [any differences observed]
```

---

## Task 18: Performance Baseline Comparison

**Files:**
- Test: Performance metrics

**Step 1: Measure response times**

For each endpoint, measure average response time over 3 requests:
- Collection suggestions: Avg Xs
- Next game suggestions: Avg Xs
- Cover generation: Avg Xs

**Step 2: Compare with Phase 0 baseline (if available)**

Expected: ±5% of baseline response times

**Step 3: Document performance**

Append to `backend/test-results-phase1.md`:

```markdown
## Performance Metrics
- Collection suggestions: Avg Xs (baseline: Ys, diff: Z%)
- Next game suggestions: Avg Xs (baseline: Ys, diff: Z%)
- Cover generation: Avg Xs (baseline: Ys, diff: Z%)
- Performance delta: ACCEPTABLE/UNACCEPTABLE (within ±5%)
```

---

## Task 19: Final Verification

**Files:**
- Verify: All checks pass

**Step 1: Run full typecheck**

Run: `cd backend && bun run typecheck`

Expected: `✓ No errors found`

**Step 2: Run full lint**

Run: `cd backend && bun run lint`

Expected: `✓ No linting errors`

**Step 3: Verify all tests documented**

Check: `backend/test-results-phase1.md` has all sections filled

**Step 4: Verify all commits made**

Run: `cd backend && git log --oneline -20`

Expected: See all commits from Tasks 2-12

**Step 5: Create summary commit**

```bash
cd backend
git add test-results-phase1.md
git commit -m "docs: add phase 1 test results"
```

---

## Task 20: Phase 1 Completion Report

**Files:**
- Create: `backend/docs/phase1-completion-report.md`

**Step 1: Create completion report**

Create file: `backend/docs/phase1-completion-report.md`

```markdown
# Phase 1 Completion Report: Vercel AI SDK Migration

## Summary
Successfully migrated from OpenAI SDK to Vercel AI SDK with zero breaking changes.

## Changes Made
1. Replaced `openai` dependency with `ai` and `@ai-sdk/openai`
2. Updated `createOpenAIClient` → `createVercelAIClient`
3. Refactored `suggestCollections` to use `generateText()`
4. Refactored `suggestNextGame` to use `generateText()`
5. Refactored `generateCollectionCover` to use Vercel AI SDK
6. Updated model discovery to use hardcoded model list
7. Updated AI routes to use Vercel client

## Test Results
- ✅ All endpoints functional
- ✅ Response formats unchanged
- ✅ Cost tracking accurate (±$0.0001)
- ✅ Performance within ±5% of baseline
- ✅ Activity logging correct

## Metrics
| Metric | Phase 0 | Phase 1 | Delta |
|--------|---------|---------|-------|
| Token usage | X | Y | Z% |
| Cost per request | $X | $Y | Z% |
| Response time | Xs | Ys | Z% |

## Breaking Changes
None. All endpoints maintain identical behavior.

## Next Steps
Phase 2: Embedding Infrastructure
- Add pgvector extension
- Create embedding tables
- Implement embedding generation service
```

**Step 2: Review test results**

Review `backend/test-results-phase1.md` and fill in metrics table

**Step 3: Commit completion report**

```bash
cd backend
git add docs/phase1-completion-report.md
git commit -m "docs: phase 1 completion report"
```

**Step 4: Push completion (if ready to merge)**

Note: Only push when ready to create PR. Releases are automated via release-please.

```bash
git push origin HEAD
```

---

## Verification Checklist

After completing all tasks, verify:

- ✅ `bun run typecheck` passes
- ✅ `bun run lint` passes
- ✅ All 3 AI endpoints tested and working
- ✅ Cost tracking accurate
- ✅ Response formats unchanged
- ✅ Performance within acceptable range (±5%)
- ✅ Activity logging correct
- ✅ OpenAI SDK fully removed
- ✅ All commits made
- ✅ Test results documented
- ✅ Completion report created

## Rollback Procedure

If any issues occur:

```bash
cd backend
git revert HEAD~12..HEAD  # Revert last 12 commits
bun install  # Restore old dependencies
bun run typecheck && bun run lint  # Verify rollback
```

This reverts to OpenAI SDK while preserving all data.

---

## Total Estimated Time

- Task 1-2: 10 minutes (baseline + dependencies)
- Task 3-8: 60 minutes (refactoring)
- Task 9-12: 20 minutes (cleanup)
- Task 13-18: 45 minutes (testing)
- Task 19-20: 15 minutes (verification)

**Total: ~2.5 hours**
