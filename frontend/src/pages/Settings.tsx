import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BackButton, PageLayout } from "@/components/layout";
import { Badge, Button, Card, TextDisplay } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/contexts/ThemeContext";
import { IGDBCredentialsForm } from "@/features/credentials/components";
import {
  useCredentials,
  useDeleteCredentials,
  useValidateCredentials,
} from "@/features/credentials/hooks";
import { useUserPreferences, type UserPreferences } from "@/hooks/useUserPreferences";
import { preferencesAPI } from "@/lib/api";
import { useCredentialsStore } from "@/shared/stores/credentialsStore";

type Theme = "light" | "dark" | "auto";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const THEME_OPTIONS: Array<{ value: Theme; label: string; description: string }> = [
  { value: "light", label: "Light", description: "Catppuccin Latte" },
  { value: "dark", label: "Dark", description: "Catppuccin Mocha" },
  { value: "auto", label: "Auto", description: "Match system preference" },
];

/**
 * Settings page component for managing user preferences and API credentials.
 * Displays sections for library view, items per page, theme, and IGDB credentials.
 */
export function Settings(): JSX.Element {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);

  const { data, isLoading } = useUserPreferences();

  // Credentials hooks
  useCredentials();
  const deleteCredentials = useDeleteCredentials();
  const validateCredentials = useValidateCredentials();
  const hasIgdbCredentialsFn = useCredentialsStore((s) => s.hasIgdbCredentials);
  const isIgdbTokenExpiredFn = useCredentialsStore((s) => s.isIgdbTokenExpired);
  const hasIgdbCredentials = hasIgdbCredentialsFn();
  const isIgdbTokenExpired = isIgdbTokenExpiredFn();

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

  const handleThemeChange = async (nextTheme: Theme): Promise<void> => {
    if (isUpdatingTheme || nextTheme === theme) {
      return;
    }

    setIsUpdatingTheme(true);
    await setTheme(nextTheme);
    setIsUpdatingTheme(false);
    showToast("Theme updated", "success");
  };

  const handleRefreshCredentials = (): void => {
    validateCredentials.mutate("igdb", {
      onSuccess: () => {
        showToast("Credentials refreshed successfully", "success");
      },
      onError: () => {
        showToast("Failed to refresh credentials", "error");
      },
    });
  };

  const handleRemoveCredentials = (): void => {
    deleteCredentials.mutate("igdb", {
      onSuccess: () => {
        showToast("Credentials removed", "success");
      },
      onError: () => {
        showToast("Failed to remove credentials", "error");
      },
    });
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center gap-3">
            <BackButton
              iconOnly={true}
              className="rounded-lg p-2 text-text-secondary transition-all duration-standard hover:bg-surface hover:text-text-primary md:hidden"
            />
            <TextDisplay as="h1" size="2xl" weight="bold">
              Settings
            </TextDisplay>
          </div>
          <Card className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-1/3 rounded bg-elevated"></div>
              <div className="h-12 rounded bg-elevated"></div>
              <div className="h-8 w-1/3 rounded bg-elevated"></div>
              <div className="h-12 rounded bg-elevated"></div>
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
            className="rounded-lg p-2 text-text-secondary transition-all duration-standard hover:bg-surface hover:text-text-primary md:hidden"
          />
          <TextDisplay as="h1" size="2xl" weight="bold">
            Settings
          </TextDisplay>
        </div>

        <Card className="space-y-8 p-6">
          <div>
            <TextDisplay as="h2" size="xl" weight="semibold" variant="primary">
              Library View
            </TextDisplay>
            <TextDisplay variant="secondary" size="sm" className="mb-4 mt-2">
              Choose how your game library is displayed by default.
            </TextDisplay>
            <div className="flex gap-3">
              <Button
                onClick={() => handleViewChange("grid")}
                disabled={updateMutation.isPending}
                variant="ghost"
                className={`h-auto flex-1 rounded-lg border-2 px-4 py-3 transition-all ${
                  preferences.default_view === "grid"
                    ? "bg-accent/20 border-accent text-accent"
                    : "border-border bg-surface text-text-secondary hover:border-elevated"
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
                  <span className="text-xs text-text-muted">Game covers in a grid</span>
                </div>
              </Button>
              <Button
                onClick={() => handleViewChange("table")}
                disabled={updateMutation.isPending}
                variant="ghost"
                className={`h-auto flex-1 rounded-lg border-2 px-4 py-3 transition-all ${
                  preferences.default_view === "table"
                    ? "bg-accent/20 border-accent text-accent"
                    : "border-border bg-surface text-text-secondary hover:border-elevated"
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
                  <span className="text-xs text-text-muted">Sortable list format</span>
                </div>
              </Button>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <TextDisplay as="h2" size="xl" weight="semibold" variant="primary">
              Items Per Page
            </TextDisplay>
            <TextDisplay variant="secondary" size="sm" className="mb-4 mt-2">
              Number of games to show per page in your library.
            </TextDisplay>
            <div className="flex gap-2">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <Button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  disabled={updateMutation.isPending}
                  variant="ghost"
                  className={`h-auto rounded-lg border px-4 py-2 transition-all ${
                    preferences.items_per_page === size
                      ? "bg-accent/20 border-accent text-accent"
                      : "border-border bg-surface text-text-secondary hover:border-elevated"
                  }`}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <TextDisplay as="h2" size="xl" weight="semibold" variant="primary">
              Theme
            </TextDisplay>
            <TextDisplay variant="secondary" size="sm" className="mb-4 mt-2">
              Appearance settings for the application.
            </TextDisplay>
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
                      ? "bg-accent/20 border-accent text-accent"
                      : "border-border bg-surface text-text-secondary hover:border-elevated"
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-text-muted">{option.description}</div>
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <TextDisplay as="h2" size="xl" weight="semibold" variant="primary">
              API Credentials
            </TextDisplay>
            <TextDisplay variant="secondary" size="sm" className="mb-4 mt-2">
              Configure credentials for external game database services.
            </TextDisplay>

            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TextDisplay weight="medium">IGDB</TextDisplay>
                    {hasIgdbCredentials ? (
                      isIgdbTokenExpired ? (
                        <Badge className="rounded-full bg-amber-500/20 text-amber-500">
                          Expired
                        </Badge>
                      ) : (
                        <Badge className="rounded-full bg-green-500/20 text-green-500">
                          Active
                        </Badge>
                      )
                    ) : (
                      <Badge className="bg-text-muted/20 rounded-full text-text-muted">
                        Not configured
                      </Badge>
                    )}
                  </div>
                  {hasIgdbCredentials && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefreshCredentials}
                        disabled={validateCredentials.isPending}
                      >
                        {validateCredentials.isPending ? "Refreshing..." : "Refresh"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCredentials}
                        disabled={deleteCredentials.isPending}
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                      >
                        {deleteCredentials.isPending ? "Removing..." : "Remove"}
                      </Button>
                    </div>
                  )}
                </div>
                {!hasIgdbCredentials && (
                  <div className="mt-4">
                    <IGDBCredentialsForm />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
