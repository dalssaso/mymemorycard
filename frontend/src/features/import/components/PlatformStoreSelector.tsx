import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlatformsService, StoresService } from "@/shared/api/services";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/** Platform info from IGDB game data */
interface IgdbPlatform {
  igdb_platform_id: number;
  name: string;
}

/** Store suggestion from IGDB websites */
interface SuggestedStore {
  slug: string;
  display_name: string;
}

/** Props for the PlatformStoreSelector component */
interface PlatformStoreSelectorProps {
  /** Available platforms from IGDB for this game */
  platforms: IgdbPlatform[];
  /** Suggested stores from IGDB websites */
  suggestedStores: SuggestedStore[];
  /** Callback when platform and store are selected */
  onSelect: (platformId: string, storeId: string) => void;
}

/**
 * Platform and store selector for game import flow.
 * Filters available platforms and stores based on the game's IGDB data.
 */
export function PlatformStoreSelector({
  platforms,
  suggestedStores,
  onSelect,
}: PlatformStoreSelectorProps): JSX.Element {
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  const {
    data: platformsData,
    isLoading: platformsLoading,
    isError: platformsError,
  } = useQuery({
    queryKey: ["platforms"],
    queryFn: () => PlatformsService.list(),
  });

  const {
    data: storesData,
    isLoading: storesLoading,
    isError: storesError,
  } = useQuery({
    queryKey: ["stores"],
    queryFn: () => StoresService.list(),
  });

  const availablePlatforms = useMemo(() => {
    if (!platformsData?.platforms) return [];
    const igdbIds = new Set(platforms.map((p) => p.igdb_platform_id));
    return platformsData.platforms.filter(
      (p) => p.igdb_platform_id !== null && igdbIds.has(p.igdb_platform_id)
    );
  }, [platformsData, platforms]);

  const availableStores = useMemo(() => {
    if (!storesData?.stores || !selectedPlatformId) return [];

    const selectedPlatform = availablePlatforms.find((p) => p.id === selectedPlatformId);
    if (!selectedPlatform) return [];

    const suggestedSlugs = new Set(suggestedStores.map((s) => s.slug));
    return storesData.stores.filter(
      (s) => suggestedSlugs.has(s.slug) && s.platform_family === selectedPlatform.platform_family
    );
  }, [storesData, selectedPlatformId, availablePlatforms, suggestedStores]);

  // Clear store selection when platform changes or when store is not in available list
  useEffect(() => {
    if (selectedStoreId && !availableStores.some((s) => s.id === selectedStoreId)) {
      setSelectedStoreId("");
    }
  }, [selectedPlatformId, availableStores, selectedStoreId]);

  const isValid =
    selectedPlatformId && selectedStoreId && availableStores.some((s) => s.id === selectedStoreId);

  const handleImport = (): void => {
    if (isValid) {
      onSelect(selectedPlatformId, selectedStoreId);
    }
  };

  return (
    <div className="bg-surface/50 space-y-4 rounded-lg border border-border p-4">
      <div>
        <Label htmlFor="platform-select" className="text-text-secondary">
          Platform
        </Label>
        <Select value={selectedPlatformId} onValueChange={setSelectedPlatformId}>
          <SelectTrigger id="platform-select" className="mt-2" disabled={platformsLoading}>
            <SelectValue placeholder="Select platform..." />
          </SelectTrigger>
          <SelectContent>
            {availablePlatforms.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
                {p.platform_family && ` (${p.platform_family})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {platformsError && (
          <p className="mt-2 text-xs text-destructive">Failed to load platforms. Please try again.</p>
        )}

        {!platformsLoading && !platformsError && availablePlatforms.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">No platforms available for this game.</p>
        )}
      </div>

      <div>
        <Label htmlFor="store-select" className="text-text-secondary">
          Store / Purchase Source
        </Label>
        <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
          <SelectTrigger
            id="store-select"
            className="mt-2"
            disabled={!selectedPlatformId || storesLoading || availableStores.length === 0}
          >
            <SelectValue placeholder="Select store..." />
          </SelectTrigger>
          <SelectContent>
            {availableStores.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {storesError && (
          <p className="mt-2 text-xs text-destructive">Failed to load stores. Please try again.</p>
        )}

        {selectedPlatformId && availableStores.length === 0 && !storesLoading && !storesError && (
          <p className="mt-2 text-xs text-muted-foreground">
            No stores available for this platform. Please select a different platform.
          </p>
        )}
      </div>

      <Button onClick={handleImport} disabled={!isValid} className="w-full">
        Import Game
      </Button>
    </div>
  );
}
