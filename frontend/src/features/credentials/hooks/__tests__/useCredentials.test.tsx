import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useCredentials,
  useCredentialStatus,
  useSaveCredentials,
  useValidateCredentials,
  useDeleteCredentials,
} from "../useCredentials";

vi.mock("@/shared/api/services", () => ({
  CredentialsService: {
    list: vi.fn().mockResolvedValue({
      services: [
        {
          service: "igdb",
          is_active: true,
          has_valid_token: true,
          token_expires_at: null,
          last_validated_at: null,
        },
      ],
    }),
    create: vi.fn().mockResolvedValue({
      service: "igdb",
      credential_type: "twitch_oauth",
      is_active: true,
      message: "Credentials saved successfully",
    }),
    validate: vi.fn().mockResolvedValue({
      service: "igdb",
      valid: true,
      has_valid_token: true,
      token_expires_at: null,
      message: "Credentials are valid",
    }),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/shared/stores/credentialsStore", () => ({
  useCredentialsStore: vi.fn((selector) => {
    const state = {
      credentials: [],
      setCredentials: vi.fn(),
    };
    return selector(state);
  }),
}));

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe("useCredentials", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("should fetch credentials list", async () => {
    const { result } = renderHook(() => useCredentials(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});

describe("useCredentialStatus", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("should return undefined when no matching credential", () => {
    const { result } = renderHook(() => useCredentialStatus("igdb"), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current).toBeUndefined();
  });
});

describe("useSaveCredentials", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("should return mutation with mutate function", () => {
    const { result } = renderHook(() => useSaveCredentials(), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current.mutate).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });
});

describe("useValidateCredentials", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("should return mutation with mutate function", () => {
    const { result } = renderHook(() => useValidateCredentials(), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current.mutate).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });
});

describe("useDeleteCredentials", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("should return mutation with mutate function", () => {
    const { result } = renderHook(() => useDeleteCredentials(), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current.mutate).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });
});
