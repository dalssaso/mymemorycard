import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CustomPlatformModal } from "@/components/CustomPlatformModal";
import { BackButton, PageLayout } from "@/components/layout";
import { PlatformOnboardingSidebar } from "@/components/sidebar";
import { Button, Card, Input } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { PlatformTypeIcon } from "@/components/PlatformTypeIcon";
import { platformsAPI, userPlatformsAPI } from "@/lib/api";
import { usePlatforms, type PlatformSummary } from "@/hooks/usePlatforms";
import { useUserPlatforms } from "@/hooks/useUserPlatforms";

export function PlatformOnboarding() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { data: rawgPlatformsData, isLoading: isLoadingPlatforms } = usePlatforms();
  const { data: userPlatformsData, isLoading: isLoadingUserPlatforms } = useUserPlatforms();

  const userPlatforms = useMemo(
    () => userPlatformsData?.platforms ?? [],
    [userPlatformsData?.platforms]
  );
  const existingPlatformIds = useMemo(
    () => new Set(userPlatforms.map((platform) => platform.platform_id)),
    [userPlatforms]
  );

  useEffect(() => {
    if (!isLoadingUserPlatforms && userPlatforms.length > 0) {
      navigate({ to: "/platforms" });
    }
  }, [isLoadingUserPlatforms, navigate, userPlatforms.length]);

  const addPlatformsMutation = useMutation({
    mutationFn: async (platformIds: string[]) => {
      await Promise.all(platformIds.map((platformId) => userPlatformsAPI.add({ platformId })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-platforms"] });
      showToast("Platforms saved", "success");
    },
    onError: () => {
      showToast("Failed to save platforms", "error");
    },
  });

  const customPlatformMutation = useMutation({
    mutationFn: async (data: {
      displayName: string;
      platformType: string;
      websiteUrl?: string;
      defaultIconUrl?: string;
      colorPrimary?: string;
    }) => {
      const response = await platformsAPI.create(data);
      const platform = response.data as { platform: PlatformSummary };
      await userPlatformsAPI.add({ platformId: platform.platform.id });
      return platform.platform;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platforms"] });
      queryClient.invalidateQueries({ queryKey: ["user-platforms"] });
      setIsCustomModalOpen(false);
      showToast("Custom platform added", "success");
    },
    onError: () => {
      showToast("Failed to add custom platform", "error");
    },
  });

  const rawgPlatforms = rawgPlatformsData?.platforms || [];
  const filteredPlatforms = rawgPlatforms.filter((platform) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      platform.display_name.toLowerCase().includes(term) ||
      platform.name.toLowerCase().includes(term)
    );
  });

  const handleToggle = (platformId: string) => {
    if (existingPlatformIds.has(platformId)) {
      return;
    }
    setSelectedPlatformIds((prev) =>
      prev.includes(platformId) ? prev.filter((id) => id !== platformId) : [...prev, platformId]
    );
  };

  const handleSave = () => {
    const newPlatformIds = selectedPlatformIds.filter((id) => !existingPlatformIds.has(id));

    if (newPlatformIds.length === 0) {
      showToast("No new platforms selected", "warning");
      return;
    }

    addPlatformsMutation.mutate(newPlatformIds);
  };

  const sidebarContent = (
    <PlatformOnboardingSidebar
      selectedCount={selectedPlatformIds.length}
      onAddCustomPlatform={() => setIsCustomModalOpen(true)}
    />
  );

  return (
    <PageLayout sidebar={sidebarContent} customCollapsed={true}>
      <div className="mx-auto max-w-5xl pt-2">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <BackButton
              iconOnly={true}
              className="text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text rounded-lg p-2 transition-all md:hidden"
            />
            <h1 className="text-ctp-text text-4xl font-bold">Choose Your Platforms</h1>
          </div>
          <p className="text-ctp-subtext0 mt-2">
            Select the platforms you use. This keeps your imports focused and relevant.
          </p>
        </div>

        <Card className="mb-6 p-6">
          <label className="mb-2 block text-sm font-medium" htmlFor="platform-onboarding-search">
            Search platforms
          </label>
          <Input
            id="platform-onboarding-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name"
          />
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-ctp-text text-lg font-semibold">Platforms</h2>
            <span className="text-ctp-subtext0 text-sm">{selectedPlatformIds.length} selected</span>
          </div>

          {isLoadingPlatforms ? (
            <div className="text-ctp-subtext0">Loading platforms...</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPlatforms.map((platform) => {
                const isSelected = selectedPlatformIds.includes(platform.id);
                const isLocked = existingPlatformIds.has(platform.id);
                return (
                  <Button
                    key={platform.id}
                    type="button"
                    onClick={() => handleToggle(platform.id)}
                    disabled={isLocked}
                    variant="outline"
                    className={`w-full justify-start border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "bg-ctp-mauve/20 border-ctp-mauve"
                        : "bg-ctp-mantle/50 border-ctp-surface0 hover:border-ctp-surface1"
                    } disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-ctp-text font-medium">{platform.display_name}</div>
                      {isLocked && <span className="text-ctp-mauve text-xs">Saved</span>}
                    </div>
                    <PlatformTypeIcon
                      type={platform.platform_type}
                      size="sm"
                      showLabel={true}
                      color={platform.color_primary}
                    />
                  </Button>
                );
              })}

              {!isLoadingPlatforms && filteredPlatforms.length === 0 && (
                <p className="text-ctp-subtext0">No platforms match your search.</p>
              )}
            </div>
          )}
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleSave} disabled={addPlatformsMutation.isPending}>
            {addPlatformsMutation.isPending ? "Saving..." : "Save platforms"}
          </Button>
          <Button variant="secondary" onClick={() => setIsCustomModalOpen(true)}>
            Add Custom Platform
          </Button>
          <Button variant="secondary" onClick={() => navigate({ to: "/import" })}>
            Continue to Import
          </Button>
        </div>
      </div>

      <CustomPlatformModal
        isOpen={isCustomModalOpen}
        isSubmitting={customPlatformMutation.isPending}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmit={(data) => customPlatformMutation.mutate(data)}
      />
    </PageLayout>
  );
}
