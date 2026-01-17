import { useState, useMemo } from "react";
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
  /** IGDB game ID for the game being imported */
  igdbId: number;
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

  const { data: platformsData, isLoading: platformsLoading } = useQuery({
    queryKey: ["platforms"],
    queryFn: () => PlatformsService.list(),
  });

  const { data: storesData, isLoading: storesLoading } = useQuery({
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
      (s) => suggestedSlugs.has(s.name) && s.platform_family === selectedPlatform.platform_family
    );
  }, [storesData, selectedPlatformId, availablePlatforms, suggestedStores]);

  const isValid = selectedPlatformId && selectedStoreId;

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

        {selectedPlatformId && availableStores.length === 0 && !storesLoading && (
          <p className="mt-2 text-xs text-amber-400">
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
