import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BackButton, PageLayout } from "@/components/layout";
import { Button, Card, Input, SelectField } from "@/components/ui";
import type { SelectFieldOption } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/contexts/ThemeContext";
import { preferencesAPI, aiAPI } from "@/lib/api";
import { useAIModels } from "@/hooks/useAIModels";
import { useAISettings } from "@/hooks/useAISettings";
import { useUserPreferences } from "@/hooks/useUserPreferences";

type Theme = "light" | "dark" | "auto";

const providerFormSchema = z.object({
  base_url: z.string().optional().or(z.literal("")),
  api_key: z.string().optional().or(z.literal("")),
  model: z.string().optional().or(z.literal("")),
  image_model: z.string().optional().or(z.literal("")),
  temperature: z.coerce.number().min(0).max(2).optional(),
  max_tokens: z.coerce.number().min(100).max(16000).optional(),
});

type ProviderFormValues = z.infer<typeof providerFormSchema>;

interface UserPreferences {
  default_view: "grid" | "table";
  items_per_page: number;
  theme: Theme;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const THEME_OPTIONS: Array<{ value: Theme; label: string; description: string }> = [
  { value: "light", label: "Light", description: "Catppuccin Latte" },
  { value: "dark", label: "Dark", description: "Catppuccin Mocha" },
  { value: "auto", label: "Auto", description: "Match system preference" },
];

export function Settings() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);

  const { data, isLoading } = useUserPreferences();

  const updateMutation = useMutation({
    mutationFn: (prefs: Partial<UserPreferences>) => preferencesAPI.update(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      showToast("Preferences saved", "success");
    },
    onError: () => {
      showToast("Failed to save preferences", "error");
    },
  });

  const preferences = data?.preferences || {
    default_view: "grid",
    items_per_page: 25,
    theme,
  };

  const handleViewChange = (view: "grid" | "table") => {
    updateMutation.mutate({ default_view: view });
  };

  const handlePageSizeChange = (size: number) => {
    updateMutation.mutate({ items_per_page: size });
  };

  const handleThemeChange = async (nextTheme: Theme) => {
    if (isUpdatingTheme || nextTheme === theme) {
      return;
    }

    setIsUpdatingTheme(true);
    await setTheme(nextTheme);
    setIsUpdatingTheme(false);
    showToast("Theme updated", "success");
  };

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("openai");
  const [providerForms, setProviderForms] = useState<
    Record<
      string,
      {
        base_url?: string | null;
        api_key?: string | null;
        api_key_masked?: string | null;
        model?: string;
        image_model?: string | null;
        temperature?: number;
        max_tokens?: number;
      }
    >
  >({});

  const currentForm = providerForms[selectedProvider] || {};

  const providerForm = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema) as Resolver<ProviderFormValues>,
    defaultValues: {
      base_url: currentForm.base_url ?? "",
      api_key: currentForm.api_key ?? "",
      model: currentForm.model ?? "",
      image_model: currentForm.image_model ?? "",
      temperature: currentForm.temperature ?? 0.7,
      max_tokens: currentForm.max_tokens ?? 12000,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = providerForm;

  const { data: aiData } = useAISettings();

  useEffect(() => {
    if (!aiData) {
      return;
    }

    const forms: typeof providerForms = {};
    aiData.providers.forEach((provider) => {
      forms[provider.provider] = {
        base_url: provider.base_url,
        api_key_masked: provider.api_key_masked ?? null,
        model: provider.model,
        image_model: provider.image_model,
        temperature: provider.temperature ?? undefined,
        max_tokens: provider.max_tokens ?? undefined,
      };
    });

    setProviderForms(forms);

    if (aiData.activeProvider) {
      setSelectedProvider(aiData.activeProvider.provider);
    } else if (aiData.providers.length > 0) {
      setSelectedProvider(aiData.providers[0].provider);
    }
  }, [aiData]);

  const { data: modelsData, isLoading: modelsLoading } = useAIModels("openai");

  const lastProviderRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastProviderRef.current === selectedProvider) {
      return;
    }
    lastProviderRef.current = selectedProvider;
    const formValues = providerForms[selectedProvider];
    reset({
      base_url: formValues?.base_url ?? "",
      api_key: formValues?.api_key ?? "",
      model: formValues?.model ?? "",
      image_model: formValues?.image_model ?? "",
      temperature: formValues?.temperature ?? 0.7,
      max_tokens: formValues?.max_tokens ?? 12000,
    });
  }, [providerForms, reset, selectedProvider]);

  const updateAiMutation = useMutation({
    mutationFn: aiAPI.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
      // Also invalidate models query so it refetches with new API key
      queryClient.invalidateQueries({ queryKey: ["ai-models", selectedProvider] });
      showToast("AI provider settings saved", "success");
    },
    onError: () => {
      showToast("Failed to save provider settings", "error");
    },
  });

  const updateCurrentForm = (updates: Partial<typeof currentForm>) => {
    setProviderForms((prev) => ({
      ...prev,
      [selectedProvider]: {
        ...(prev[selectedProvider] || {}),
        ...updates,
      },
    }));

    Object.entries(updates).forEach(([key, value]) => {
      setValue(
        key as keyof ProviderFormValues,
        value as ProviderFormValues[keyof ProviderFormValues],
        {
          shouldDirty: true,
          shouldValidate: false,
        }
      );
    });
  };

  const temperatureValue = watch("temperature") ?? currentForm.temperature ?? 0.7;
  const maxTokensValue = watch("max_tokens") ?? currentForm.max_tokens ?? 12000;

  const handleAiSettingsSubmit = handleSubmit((values) => {
    const apiKey =
      currentForm.api_key_masked && values.api_key === currentForm.api_key_masked
        ? undefined
        : values.api_key || undefined;

    updateAiMutation.mutate({
      provider: selectedProvider,
      baseUrl: values.base_url || undefined,
      apiKey,
      model: values.model || undefined,
      imageModel: values.image_model || undefined,
      temperature: values.temperature,
      maxTokens: values.max_tokens,
      setActive: true, // Always set as active when saving
    });
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center gap-3">
            <BackButton
              iconOnly={true}
              className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text md:hidden"
            />
            <h1 className="text-4xl font-bold text-ctp-text">Settings</h1>
          </div>
          <Card className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-1/3 rounded bg-ctp-surface1"></div>
              <div className="h-12 rounded bg-ctp-surface1"></div>
              <div className="h-8 w-1/3 rounded bg-ctp-surface1"></div>
              <div className="h-12 rounded bg-ctp-surface1"></div>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <BackButton
            iconOnly={true}
            className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text md:hidden"
          />
          <h1 className="text-4xl font-bold text-ctp-text">Settings</h1>
        </div>

        <Card className="space-y-8 p-6">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-ctp-mauve">Library View</h2>
            <p className="mb-4 text-sm text-ctp-subtext0">
              Choose how your game library is displayed by default.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleViewChange("grid")}
                disabled={updateMutation.isPending}
                variant="ghost"
                className={`h-auto flex-1 rounded-lg border-2 px-4 py-3 transition-all ${
                  preferences.default_view === "grid"
                    ? "bg-ctp-mauve/20 border-ctp-mauve text-ctp-mauve"
                    : "border-ctp-surface1 bg-ctp-surface0 text-ctp-subtext0 hover:border-ctp-surface2"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                    />
                  </svg>
                  <span className="font-medium">Grid View</span>
                  <span className="text-xs text-ctp-overlay1">Game covers in a grid</span>
                </div>
              </Button>
              <Button
                onClick={() => handleViewChange("table")}
                disabled={updateMutation.isPending}
                variant="ghost"
                className={`h-auto flex-1 rounded-lg border-2 px-4 py-3 transition-all ${
                  preferences.default_view === "table"
                    ? "bg-ctp-mauve/20 border-ctp-mauve text-ctp-mauve"
                    : "border-ctp-surface1 bg-ctp-surface0 text-ctp-subtext0 hover:border-ctp-surface2"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                    />
                  </svg>
                  <span className="font-medium">Table View</span>
                  <span className="text-xs text-ctp-overlay1">Sortable list format</span>
                </div>
              </Button>
            </div>
          </div>

          <div className="border-t border-ctp-surface0 pt-8">
            <h2 className="mb-4 text-xl font-semibold text-ctp-mauve">Items Per Page</h2>
            <p className="mb-4 text-sm text-ctp-subtext0">
              Number of games to show per page in your library.
            </p>
            <div className="flex gap-2">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <Button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  disabled={updateMutation.isPending}
                  variant="ghost"
                  className={`h-auto rounded-lg border px-4 py-2 transition-all ${
                    preferences.items_per_page === size
                      ? "bg-ctp-teal/20 border-ctp-teal text-ctp-teal"
                      : "border-ctp-surface1 bg-ctp-surface0 text-ctp-subtext0 hover:border-ctp-surface2"
                  }`}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t border-ctp-surface0 pt-8">
            <h2 className="mb-4 text-xl font-semibold text-ctp-mauve">Theme</h2>
            <p className="mb-4 text-sm text-ctp-subtext0">
              Appearance settings for the application.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {THEME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange(option.value)}
                  disabled={isUpdatingTheme}
                  variant="ghost"
                  className={`h-auto rounded-lg border-2 px-4 py-3 text-left transition-all ${
                    theme === option.value
                      ? "bg-ctp-mauve/20 border-ctp-mauve text-ctp-mauve"
                      : "border-ctp-surface1 bg-ctp-surface0 text-ctp-subtext0 hover:border-ctp-surface2"
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-ctp-overlay1">{option.description}</div>
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t border-ctp-surface0 pt-8">
            <h2 className="mb-4 text-xl font-semibold text-ctp-mauve">AI Curator Settings</h2>
            <p className="mb-4 text-sm text-ctp-subtext0">
              Configure AI-powered features for collection suggestions and recommendations.
            </p>

            <div className="mb-6">
              <p className="mb-3 block text-sm font-medium text-ctp-text">AI Provider</p>
              <div className="border-ctp-mauve/50 bg-ctp-mauve/20 rounded-lg border-2 px-4 py-3 text-sm text-ctp-mauve">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-ctp-green"></span>
                  OpenAI
                </div>
              </div>
              <p className="mt-2 text-xs text-ctp-overlay1">
                <a
                  href="https://github.com/dalssaso/mymemorycard/blob/main/docs/ai-curator-settings/openai.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ctp-blue hover:underline"
                >
                  View setup guide
                </a>
              </p>
            </div>

            <form
              onSubmit={handleAiSettingsSubmit}
              className="space-y-6 border-t border-ctp-surface0 pt-6"
            >
              <div>
                <h3 className="text-lg font-medium text-ctp-text">OpenAI Configuration</h3>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-ctp-text"
                  htmlFor="provider-api-key"
                >
                  API Key
                </label>
                <Input
                  id="provider-api-key"
                  type={
                    currentForm.api_key === undefined && currentForm.api_key_masked
                      ? "text"
                      : "password"
                  }
                  {...register("api_key")}
                  value={
                    currentForm.api_key !== undefined
                      ? currentForm.api_key || ""
                      : currentForm.api_key_masked || ""
                  }
                  onChange={(e) => updateCurrentForm({ api_key: e.target.value || null })}
                  onFocus={(e) => {
                    if (currentForm.api_key === undefined && currentForm.api_key_masked) {
                      updateCurrentForm({ api_key: "" });
                      setTimeout(() => e.target.select(), 0);
                    }
                  }}
                  placeholder={
                    currentForm.api_key_masked
                      ? "Click to replace existing key"
                      : "Enter your API key"
                  }
                  className="bg-ctp-surface0 text-ctp-text focus-visible:ring-ctp-mauve"
                  readOnly={currentForm.api_key === undefined && currentForm.api_key_masked != null}
                />
                {errors.api_key && (
                  <p className="mt-1 text-xs text-ctp-red">{errors.api_key.message}</p>
                )}
                <p className="mt-1 text-xs text-ctp-overlay1">
                  {currentForm.api_key_masked && currentForm.api_key === undefined
                    ? "API key configured. Click the field to replace it."
                    : "Your API key is encrypted before being stored."}
                </p>
              </div>

              {currentForm.api_key_masked && (
                <>
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-ctp-text"
                      htmlFor="model-select"
                    >
                      Model
                    </label>
                    {modelsData && modelsData.textModels.length > 0 ? (
                      <SelectField
                        id="model-select"
                        value={currentForm.model || ""}
                        options={modelsData.textModels.map(
                          (model): SelectFieldOption => ({
                            value: model.id,
                            label: model.displayName,
                            metadata:
                              model.pricing.input && model.pricing.output
                                ? `$${model.pricing.input.toFixed(3)}/$${model.pricing.output.toFixed(3)} per 1M tokens`
                                : undefined,
                          })
                        )}
                        onChange={(value) => updateCurrentForm({ model: value })}
                        placeholder="Select a model"
                        className="w-full"
                      />
                    ) : (
                      <Input
                        id="model-select"
                        type="text"
                        {...register("model")}
                        value={currentForm.model || ""}
                        onChange={(e) => updateCurrentForm({ model: e.target.value })}
                        placeholder={
                          modelsLoading ? "Loading models..." : "e.g., gpt-4o, gpt-4o-mini"
                        }
                        disabled={modelsLoading}
                        className="bg-ctp-surface0 text-ctp-text focus-visible:ring-ctp-mauve disabled:opacity-50"
                      />
                    )}
                    <p className="mt-1 text-xs text-ctp-overlay1">
                      {modelsLoading
                        ? "Loading available models from OpenAI..."
                        : modelsData && modelsData.textModels.length > 0
                          ? "Select from available OpenAI models"
                          : "Save your API key first, then reload to see available models"}
                    </p>
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-ctp-text"
                      htmlFor="image-model-select"
                    >
                      Image Model
                    </label>
                    {modelsData && modelsData.imageModels.length > 0 ? (
                      <>
                        <SelectField
                          id="image-model-select"
                          value={currentForm.image_model || ""}
                          options={modelsData.imageModels.map(
                            (model): SelectFieldOption => ({
                              value: model.id,
                              label: model.displayName,
                              metadata: model.pricing.perImage
                                ? `$${model.pricing.perImage.toFixed(4)} per image`
                                : undefined,
                            })
                          )}
                          onChange={(value) => updateCurrentForm({ image_model: value || null })}
                          placeholder="Select an image model"
                          className="w-full"
                        />
                        <p className="mt-1 text-xs text-ctp-overlay1">
                          Select from available OpenAI image models
                        </p>
                      </>
                    ) : (
                      <>
                        <Input
                          id="image-model-select"
                          type="text"
                          {...register("image_model")}
                          value={currentForm.image_model || ""}
                          onChange={(e) =>
                            updateCurrentForm({ image_model: e.target.value || null })
                          }
                          placeholder={modelsLoading ? "Loading models..." : "dall-e-3"}
                          disabled={modelsLoading}
                          className="bg-ctp-surface0 text-ctp-text focus-visible:ring-ctp-mauve disabled:opacity-50"
                        />
                        <p className="mt-1 text-xs text-ctp-overlay1">
                          {modelsLoading
                            ? "Loading available models from OpenAI..."
                            : "Save your API key first, then reload to see available models. DALL-E 3 is recommended."}
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}

              <div>
                <Button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  variant="link"
                  className="flex h-auto items-center gap-1 p-0 text-sm text-ctp-blue hover:underline"
                >
                  {showAdvanced ? "Hide" : "Show"} Advanced Options
                  <svg
                    className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Button>
              </div>

              {showAdvanced && (
                <div className="space-y-4 border-l-2 border-ctp-surface1 pl-4">
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-ctp-text"
                      htmlFor="provider-base-url"
                    >
                      Base URL (Optional)
                    </label>
                    <Input
                      id="provider-base-url"
                      type="url"
                      {...register("base_url")}
                      value={currentForm.base_url || ""}
                      onChange={(e) => updateCurrentForm({ base_url: e.target.value || null })}
                      placeholder="https://api.openai.com/v1"
                      className="bg-ctp-surface0 text-ctp-text focus-visible:ring-ctp-mauve"
                    />
                    {errors.base_url && (
                      <p className="mt-1 text-xs text-ctp-red">{errors.base_url.message}</p>
                    )}
                    <p className="mt-1 text-xs text-ctp-overlay1">
                      Default: https://api.openai.com/v1. Use custom URL for Azure OpenAI or
                      proxies.
                    </p>
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-ctp-text"
                      htmlFor="temperature"
                    >
                      Temperature: {temperatureValue}
                    </label>
                    <Input
                      id="temperature"
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      {...register("temperature", { valueAsNumber: true })}
                      value={temperatureValue}
                      onChange={(e) =>
                        updateCurrentForm({ temperature: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                    <p className="mt-1 text-xs text-ctp-overlay1">
                      Lower = more focused, Higher = more creative
                    </p>
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-ctp-text"
                      htmlFor="max-tokens"
                    >
                      Max Tokens
                    </label>
                    <Input
                      id="max-tokens"
                      type="number"
                      min="100"
                      max="16000"
                      {...register("max_tokens", { valueAsNumber: true })}
                      value={maxTokensValue}
                      onChange={(e) =>
                        updateCurrentForm({ max_tokens: parseInt(e.target.value, 10) })
                      }
                      className="bg-ctp-surface0 text-ctp-text focus-visible:ring-ctp-mauve"
                    />
                    {errors.max_tokens && (
                      <p className="mt-1 text-xs text-ctp-red">{errors.max_tokens.message}</p>
                    )}
                    <p className="mt-1 text-xs text-ctp-overlay1">
                      Maximum response length. Reasoning models (GPT-5 Nano, Mini) require 12000+
                      tokens
                    </p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={updateAiMutation.isPending}
                variant="ghost"
                className="hover:bg-ctp-mauve/90 h-auto rounded-lg bg-ctp-mauve px-6 py-2 text-ctp-base transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateAiMutation.isPending ? "Saving..." : "Save OpenAI Settings"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
