import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import { aiAPI, type AiProviderConfig } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

export interface AISettingsData {
  providers: AiProviderConfig[];
  activeProvider: AiProviderConfig | null;
}

export interface UpdateAISettingsData {
  provider: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  model?: string;
  imageApiKey?: string | null;
  imageModel?: string | null;
  temperature?: number;
  maxTokens?: number;
  setActive?: boolean;
}

export function useAISettings(): UseQueryResult<AISettingsData> {
  return useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const response = await aiAPI.getSettings();
      return response.data as AISettingsData;
    },
  });
}

export function useUpdateAISettings(): UseMutationResult<unknown, Error, UpdateAISettingsData> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateAISettingsData) => {
      const response = await aiAPI.updateSettings(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
      showToast("AI settings updated", "success");
    },
    onError: () => {
      showToast("Failed to update AI settings", "error");
    },
  });
}

export function useSetActiveProvider(): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (provider: string) => {
      const response = await aiAPI.setActiveProvider(provider);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
      showToast("Active provider updated", "success");
    },
    onError: () => {
      showToast("Failed to set active provider", "error");
    },
  });
}
