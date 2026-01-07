import { router } from "@/lib/router";
import { requireAuth } from "@/middleware/auth";
import { corsHeaders } from "@/middleware/cors";
import { encrypt, decrypt } from "@/lib/encryption";
import { queryOne, queryMany, query } from "@/services/db";
import {
  suggestCollections,
  suggestNextGame,
  generateCollectionCover,
  getActivityLogs,
  estimateCost,
} from "@/services/ai/service";
import { getModelsForProvider } from "@/services/ai/models";
import { getCachedModels, setCachedModels } from "@/services/ai/cache";
import OpenAI from "openai";

function maskApiKey(encryptedKey: string | null): string | null {
  if (!encryptedKey) return null;
  try {
    const decrypted = decrypt(encryptedKey);
    if (decrypted.length <= 8) {
      return "••••••••";
    }
    const start = decrypted.substring(0, 4);
    const end = decrypted.substring(decrypted.length - 4);
    return `${start}••••••••${end}`;
  } catch {
    return null;
  }
}

router.get(
  "/api/ai/settings",
  requireAuth(async (req, user) => {
    try {
      const allSettings = await queryMany<{
        provider: string;
        base_url: string | null;
        api_key_encrypted: string | null;
        model: string;
        image_api_key_encrypted: string | null;
        image_model: string | null;
        temperature: number;
        max_tokens: number;
        is_active: boolean;
      }>(
        `SELECT provider, base_url, api_key_encrypted, model, image_api_key_encrypted, image_model, temperature, max_tokens, is_active
         FROM user_ai_settings
         WHERE user_id = $1
         ORDER BY is_active DESC, provider ASC`,
        [user.id]
      );

      const providers = allSettings.map((settings) => ({
        provider: settings.provider,
        base_url: settings.base_url,
        api_key_masked: maskApiKey(settings.api_key_encrypted),
        model: settings.model,
        image_api_key_masked: maskApiKey(settings.image_api_key_encrypted),
        image_model: settings.image_model,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        is_active: settings.is_active,
      }));

      const activeProvider = providers.find((p: (typeof providers)[0]) => p.is_active) || null;

      return new Response(JSON.stringify({ providers, activeProvider }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Get AI settings error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.get(
  "/api/ai/models/openai",
  requireAuth(async (req, user) => {
    try {
      const cached = await getCachedModels("openai");
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const settings = await queryOne<{
        base_url: string | null;
        api_key_encrypted: string | null;
      }>(
        `SELECT base_url, api_key_encrypted
         FROM user_ai_settings
         WHERE user_id = $1 AND provider = 'openai'::ai_provider`,
        [user.id]
      );

      if (!settings || !settings.api_key_encrypted) {
        return new Response(JSON.stringify({ textModels: [], imageModels: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const apiKey = decrypt(settings.api_key_encrypted);
      const config: ConstructorParameters<typeof OpenAI>[0] = { apiKey };
      if (settings.base_url) {
        config.baseURL = settings.base_url;
      }
      const client = new OpenAI(config);
      const models = await getModelsForProvider("openai", client);

      await setCachedModels("openai", models);

      return new Response(JSON.stringify(models), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Get models error:", error);
      return new Response(JSON.stringify({ textModels: [], imageModels: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.put(
  "/api/ai/settings",
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as {
        provider: string;
        baseUrl?: string | null;
        apiKey?: string | null;
        model?: string;
        imageApiKey?: string | null;
        imageModel?: string | null;
        temperature?: number;
        maxTokens?: number;
        setActive?: boolean;
      };

      const {
        provider,
        baseUrl,
        apiKey,
        model,
        imageApiKey,
        imageModel,
        temperature,
        maxTokens,
        setActive,
      } = body;

      if (!provider || provider !== "openai") {
        return new Response(JSON.stringify({ error: "Only OpenAI provider is supported" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
        return new Response(JSON.stringify({ error: "Temperature must be between 0 and 2" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      if (maxTokens !== undefined && (maxTokens < 1 || maxTokens > 16000)) {
        return new Response(JSON.stringify({ error: "Max tokens must be between 1 and 16000" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const apiKeyEncrypted = apiKey ? encrypt(apiKey) : undefined;
      const imageApiKeyEncrypted = imageApiKey ? encrypt(imageApiKey) : undefined;

      // If setActive is true, deactivate all other providers first
      if (setActive) {
        await query("UPDATE user_ai_settings SET is_active = false WHERE user_id = $1", [user.id]);
      }

      await query(
        `INSERT INTO user_ai_settings (
          user_id, provider, base_url, api_key_encrypted, model,
          image_api_key_encrypted, image_model, temperature, max_tokens, is_active, updated_at
        )
        VALUES ($1, 'openai'::ai_provider, $2, $3, COALESCE($4, 'gpt-4.1-mini'), $5, $6, COALESCE($7, 0.7), COALESCE($8, 12000), COALESCE($9, false), NOW())
        ON CONFLICT (user_id, provider)
        DO UPDATE SET
          base_url = CASE WHEN $2 IS NOT NULL THEN $2 ELSE user_ai_settings.base_url END,
          api_key_encrypted = COALESCE($3, user_ai_settings.api_key_encrypted),
          model = COALESCE($4, user_ai_settings.model),
          image_api_key_encrypted = CASE WHEN $5 IS NOT NULL THEN $5 ELSE user_ai_settings.image_api_key_encrypted END,
          image_model = COALESCE($6, user_ai_settings.image_model),
          temperature = COALESCE($7, user_ai_settings.temperature),
          max_tokens = COALESCE($8, user_ai_settings.max_tokens),
          is_active = COALESCE($9, user_ai_settings.is_active),
          updated_at = NOW()`,
        [
          user.id,
          baseUrl ?? null,
          apiKeyEncrypted ?? null,
          model ?? null,
          imageApiKeyEncrypted ?? null,
          imageModel ?? null,
          temperature ?? null,
          maxTokens ?? null,
          setActive ?? null,
        ]
      );

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Update AI settings error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.post(
  "/api/ai/set-active-provider",
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as { provider: string };
      const { provider } = body;

      if (!provider || provider !== "openai") {
        return new Response(JSON.stringify({ error: "Only OpenAI provider is supported" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Deactivate all providers
      await query("UPDATE user_ai_settings SET is_active = false WHERE user_id = $1", [user.id]);

      // Activate the OpenAI provider
      await query(
        "UPDATE user_ai_settings SET is_active = true WHERE user_id = $1 AND provider = 'openai'::ai_provider",
        [user.id]
      );

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Set active provider error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.post(
  "/api/ai/suggest-collections",
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as { theme?: string };
      const { theme } = body;

      const result = await suggestCollections(user.id, theme);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Suggest collections error:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      const status = message.includes("not enabled") ? 400 : 500;

      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.post(
  "/api/ai/suggest-next-game",
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as { userInput?: string };
      const { userInput } = body;

      const result = await suggestNextGame(user.id, userInput);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Suggest next game error:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      const status = message.includes("not enabled") ? 400 : 500;

      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.post(
  "/api/ai/generate-cover",
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as {
        collectionName: string;
        collectionDescription: string;
        collectionId: string;
      };
      const { collectionName, collectionDescription, collectionId } = body;

      if (!collectionName || !collectionDescription || !collectionId) {
        return new Response(
          JSON.stringify({ error: "Collection name, description, and ID are required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          }
        );
      }

      const result = await generateCollectionCover(
        user.id,
        collectionName,
        collectionDescription,
        collectionId
      );

      // Fetch/decode the image from temporary URL or data URL
      let imageBuffer: Buffer;
      if (result.imageUrl.startsWith("data:")) {
        // Base64 data URL - decode it
        const base64Data = result.imageUrl.split(",")[1];
        imageBuffer = Buffer.from(base64Data, "base64");
      } else {
        // Temporary URL from OpenAI - fetch it
        const imageResponse = await fetch(result.imageUrl);
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      }

      // Process with sharp (same as collections.ts cover upload)
      const sharp = (await import("sharp")).default;
      const processedBuffer = await sharp(imageBuffer)
        .resize(600, 900, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      // Save to disk
      const fs = await import("fs/promises");
      const path = await import("path");
      const timestamp = Date.now();
      const filename = `${user.id}-${collectionId}-${timestamp}.webp`;
      const coverDir = path.join(import.meta.dir, "../../uploads/collection-covers");
      await fs.mkdir(coverDir, { recursive: true });
      await fs.writeFile(path.join(coverDir, filename), processedBuffer);

      // Delete old cover if exists
      const oldCollection = await queryOne<{ cover_filename: string | null }>(
        "SELECT cover_filename FROM collections WHERE id = $1 AND user_id = $2",
        [collectionId, user.id]
      );
      if (oldCollection?.cover_filename) {
        try {
          await fs.unlink(path.join(coverDir, oldCollection.cover_filename));
        } catch {
          // Ignore if old file doesn't exist
        }
      }

      // Update database with new cover filename
      await query("UPDATE collections SET cover_filename = $1 WHERE id = $2 AND user_id = $3", [
        filename,
        collectionId,
        user.id,
      ]);

      return new Response(
        JSON.stringify({ imageUrl: `/api/collection-covers/${filename}`, cost: result.cost }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    } catch (error) {
      console.error("Generate cover error:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      const status =
        message.includes("not enabled") || message.includes("only supported") ? 400 : 500;

      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.get(
  "/api/ai/activity",
  requireAuth(async (req, user) => {
    try {
      const url = new URL(req.url);
      const limitParam = url.searchParams.get("limit");
      const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;

      const logs = await getActivityLogs(user.id, limit);

      return new Response(JSON.stringify({ logs }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Get activity logs error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.post(
  "/api/ai/estimate-cost",
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as { actionType: string };
      const { actionType } = body;

      if (
        !["suggest_collections", "suggest_next_game", "generate_cover_image"].includes(actionType)
      ) {
        return new Response(JSON.stringify({ error: "Invalid action type" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const cost = await estimateCost(user.id, actionType);

      return new Response(JSON.stringify({ estimatedCostUsd: cost }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Estimate cost error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);
