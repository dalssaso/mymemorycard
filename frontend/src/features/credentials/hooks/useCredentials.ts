import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import { CredentialsService } from "@/shared/api/services";
import { useCredentialsStore } from "@/shared/stores/credentialsStore";
import type { CredentialService, CredentialStatus } from "@/shared/types/games";
import type {
  CredentialListResponse,
  CredentialSaveResponse,
  CredentialValidateResponse,
  SaveCredentialRequest,
} from "@/shared/api/generated";

/**
 * Fetch user's configured API credentials status.
 *
 * @returns TanStack Query result with credentials data
 */
export function useCredentials(): UseQueryResult<CredentialListResponse> {
  const setCredentials = useCredentialsStore((s) => s.setCredentials);

  return useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      const data = await CredentialsService.list();
      if (data.services) {
        setCredentials(data.services as CredentialStatus[]);
      }
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get specific credential status from the store.
 *
 * @param service - Service identifier to lookup
 * @returns Credential status or undefined
 */
export function useCredentialStatus(service: CredentialService): CredentialStatus | undefined {
  const credentials = useCredentialsStore((s) => s.credentials);
  return credentials.find((c) => c.service === service);
}

/**
 * Mutation to save new credentials.
 *
 * @returns TanStack Mutation hook for saving credentials
 */
export function useSaveCredentials(): UseMutationResult<
  CredentialSaveResponse,
  Error,
  SaveCredentialRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => CredentialsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });
}

/**
 * Mutation to validate credentials.
 *
 * @returns TanStack Mutation hook for validating credentials
 */
export function useValidateCredentials(): UseMutationResult<
  CredentialValidateResponse,
  Error,
  CredentialService
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (service: CredentialService) => CredentialsService.validate(service),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });
}

/**
 * Mutation to delete credentials.
 *
 * @returns TanStack Mutation hook for deleting credentials
 */
export function useDeleteCredentials(): UseMutationResult<void, Error, CredentialService> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (service: CredentialService) => CredentialsService.delete(service),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });
}
