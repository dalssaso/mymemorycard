import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CustomPlatformModal } from "@/components/CustomPlatformModal";
import { BackButton, PageLayout } from "@/components/layout";
import { PlatformsSidebar } from "@/components/sidebar";
import { Button, Card, Input } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { PlatformTypeIcon } from "@/components/PlatformTypeIcon";
import { platformsAPI, userPlatformsAPI } from "@/lib/api";
import { useUserPlatforms } from "@/hooks/useUserPlatforms";

interface Platform {
  id: string;
  name: string;
  display_name: string;
  platform_type: "pc" | "console" | "mobile" | "physical";
  is_system: boolean;
  is_physical: boolean;
  website_url: string | null;
  color_primary: string;
  default_icon_url: string | null;
  sort_order: number;
}

function PlatformIcon({
  name,
  iconUrl,
  color,
}: {
  name: string;
  iconUrl?: string | null;
  color?: string;
}) {
  if (iconUrl) {
    return <img src={iconUrl} alt={name} className="h-full w-full object-cover" />;
  }

  const initial = name.trim().charAt(0).toUpperCase() || "P";
  const colorValue = color || "var(--color-border)";
  const hex = colorValue.startsWith("#") ? colorValue.replace("#", "") : null;
  const isLightBackground = hex
    ? (parseInt(hex.slice(0, 2), 16) * 299 +
        parseInt(hex.slice(2, 4), 16) * 587 +
        parseInt(hex.slice(4, 6), 16) * 114) /
        1000 >
      155
    : false;

  return (
    <div
      className={`flex h-full w-full items-center justify-center text-6xl font-semibold ${
        isLightBackground ? "text-text-secondary" : "text-text-primary"
      }`}
      style={{ backgroundColor: colorValue }}
    >
      {initial}
    </div>
  );
}

export function Platforms() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([]);
  const [platformTypeFilter, setPlatformTypeFilter] = useState<Platform["platform_type"] | "all">(
    "all"
  );
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: rawgPlatformsData, isLoading: isLoadingPlatforms } = useQuery({
    queryKey: ["platforms"],
    queryFn: async () => {
      const response = await platformsAPI.getAll();
      return response.data as { platforms: Platform[] };
    },
  });

  const { data: userPlatformsData } = useUserPlatforms();

  const userPlatforms = useMemo(
    () => userPlatformsData?.platforms ?? [],
    [userPlatformsData?.platforms]
  );
  const existingPlatformIds = useMemo(
    () => new Set(userPlatforms.map((platform) => platform.platform_id)),
    [userPlatforms]
  );

  const addPlatformsMutation = useMutation({
    mutationFn: async (platformIds: string[]) => {
      await Promise.all(platformIds.map((platformId) => userPlatformsAPI.add({ platformId })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-platforms"] });
      setSelectedPlatformIds([]);
      showToast("Platforms added", "success");
    },
    onError: () => {
      showToast("Failed to add platforms", "error");
    },
  });

  const customPlatformMutation = useMutation({
    mutationFn: async (data: { displayName: string; platformType?: string | null }) => {
      const response = await platformsAPI.create(data);
      const platform = response.data as { platform: Platform };
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

  const rawgPlatforms = useMemo(
    () => rawgPlatformsData?.platforms ?? [],
    [rawgPlatformsData?.platforms]
  );
  const filteredPlatforms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = rawgPlatforms.filter((platform) => {
      if (platformTypeFilter !== "all" && platform.platform_type !== platformTypeFilter) {
        return false;
      }
      if (!term) return true;
      return (
        platform.display_name.toLowerCase().includes(term) ||
        platform.name.toLowerCase().includes(term)
      );
    });

    return filtered.sort((a, b) => {
      const aLocked = existingPlatformIds.has(a.id);
      const bLocked = existingPlatformIds.has(b.id);
      if (aLocked !== bLocked) {
        return aLocked ? -1 : 1;
      }

      const aName = a.display_name || a.name;
      const bName = b.display_name || b.name;
      return aName.localeCompare(bName);
    });
  }, [existingPlatformIds, platformTypeFilter, rawgPlatforms, searchTerm]);

  const groupedPlatforms = useMemo(() => {
    const groups: Record<Platform["platform_type"], Platform[]> = {
      pc: [],
      console: [],
      mobile: [],
      physical: [],
    };

    filteredPlatforms.forEach((platform) => {
      groups[platform.platform_type].push(platform);
    });

    return groups;
  }, [filteredPlatforms]);

  const handleToggle = (platformId: string) => {
    if (existingPlatformIds.has(platformId)) {
      return;
    }
    setSelectedPlatformIds((prev) =>
      prev.includes(platformId) ? prev.filter((id) => id !== platformId) : [...prev, platformId]
    );
  };

  const handleAddSelected = () => {
    const newPlatformIds = selectedPlatformIds.filter((id) => !existingPlatformIds.has(id));

    if (newPlatformIds.length === 0) {
      showToast("No new platforms selected", "warning");
      return;
    }

    addPlatformsMutation.mutate(newPlatformIds);
  };

  const sidebarContent = (
    <PlatformsSidebar
      platformCount={userPlatforms.length}
      onAddCustomPlatform={() => setIsCustomModalOpen(true)}
    />
  );

  return (
    <PageLayout sidebar={sidebarContent} customCollapsed={true}>
      <div className="mx-auto max-w-7xl pt-2">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <BackButton
                iconOnly={true}
                className="rounded-lg p-2 text-text-secondary transition-all hover:bg-surface hover:text-text-primary md:hidden"
              />
              <h1 className="text-4xl font-bold text-text-primary">Platforms</h1>
            </div>
            <p className="mt-1 text-text-secondary">
              Keep your platform list current for accurate imports.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={() => setIsCustomModalOpen(true)}>
              Add Custom Platform
            </Button>
            <Button asChild>
              <Link to="/import">Import Games</Link>
            </Button>
          </div>
        </div>

        {userPlatforms.length === 0 ? (
          <Card className="mb-8 p-6">
            <p className="py-8 text-center text-text-secondary">
              No platforms saved yet. Add your first platform to get started.
            </p>
          </Card>
        ) : (
          <div
            className={[
              "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
              "mb-10 gap-4",
            ].join(" ")}
          >
            {userPlatforms.map((platform) => (
              <div key={platform.id} className="group">
                <Link to="/platforms/$id" params={{ id: platform.id }}>
                  <div
                    className={[
                      "aspect-square overflow-hidden rounded-lg bg-surface",
                      "relative mb-2",
                    ].join(" ")}
                  >
                    <PlatformIcon
                      name={platform.display_name}
                      iconUrl={platform.icon_url}
                      color={platform.color_primary}
                    />
                    <div
                      className={[
                        "absolute inset-0 bg-gradient-to-t",
                        "from-base/70 via-base/20 to-transparent",
                        "dark:from-base/80 dark:via-transparent dark:to-transparent",
                      ].join(" ")}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="truncate font-medium text-text-primary">
                        {platform.display_name}
                      </p>
                      <p className="truncate text-sm text-accent">
                        {platform.username || "No username set"}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        <Card className="mb-6 p-6">
          <label className="mb-2 block text-sm font-medium" htmlFor="platforms-search">
            Search platforms
          </label>
          <Input
            id="platforms-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name"
          />
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Add Platforms</h2>
            <span className="text-sm text-text-secondary">
              {selectedPlatformIds.length} selected
            </span>
          </div>

          {isLoadingPlatforms ? (
            <div className="text-text-secondary">Loading platforms...</div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={platformTypeFilter === "all" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPlatformTypeFilter("all")}
                  className="rounded-full border border-border px-3"
                >
                  All
                </Button>
                {(
                  [
                    { value: "pc", label: "Storefronts" },
                    { value: "console", label: "Console" },
                    { value: "mobile", label: "Mobile" },
                    { value: "physical", label: "Physical" },
                  ] as const
                ).map((option) => (
                  <Button
                    key={option.value}
                    variant={platformTypeFilter === option.value ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setPlatformTypeFilter(option.value)}
                    className="rounded-full border border-border px-3"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {(
                [
                  { type: "pc", label: "Storefronts" },
                  { type: "console", label: "Console" },
                  { type: "mobile", label: "Mobile & Handheld" },
                  { type: "physical", label: "Physical" },
                ] as const
              ).map((group) => {
                const platforms = groupedPlatforms[group.type];
                if (platforms.length === 0) return null;

                return (
                  <div key={group.type}>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary">
                      <PlatformTypeIcon type={group.type} size="sm" showLabel={false} />
                      <span>{group.label}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {platforms.map((platform) => {
                        const isSelected = selectedPlatformIds.includes(platform.id);
                        const isLocked = existingPlatformIds.has(platform.id);
                        return (
                          <Button
                            key={platform.id}
                            variant="ghost"
                            type="button"
                            onClick={() => handleToggle(platform.id)}
                            disabled={isLocked}
                            className={`h-auto w-full justify-start rounded-lg border px-5 py-4 text-left ${
                              isSelected
                                ? "bg-accent/10 hover:bg-accent/20 border-accent"
                                : "bg-elevated/50 hover:bg-elevated/70 border-surface hover:border-elevated"
                            }`}
                          >
                            <div className="w-full">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-medium text-text-primary">
                                  {platform.display_name}
                                </div>
                                {isLocked && <span className="text-xs text-accent">Saved</span>}
                              </div>
                              <PlatformTypeIcon
                                type={platform.platform_type}
                                size="sm"
                                showLabel={true}
                                color={platform.color_primary}
                              />
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {!isLoadingPlatforms && filteredPlatforms.length === 0 && (
                <p className="text-text-secondary">No platforms match your search.</p>
              )}
            </div>
          )}
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleAddSelected} disabled={addPlatformsMutation.isPending}>
            {addPlatformsMutation.isPending ? "Saving..." : "Add Selected Platforms"}
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
