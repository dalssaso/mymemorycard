import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, ScrollFade } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { ownershipAPI, type OwnershipData, completionLogsAPI } from "@/lib/api";

interface EditionOwnershipProps {
  gameId: string;
  platformId: string;
}

export function EditionOwnership({ gameId, platformId }: EditionOwnershipProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null);
  const [selectedDlcIds, setSelectedDlcIds] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEditionOpen, setIsEditionOpen] = useState(false);
  const editionButtonRef = useRef<HTMLButtonElement | null>(null);
  const editionListRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ownership", gameId, platformId],
    queryFn: async () => {
      const response = await ownershipAPI.get(gameId, platformId);
      return response.data as OwnershipData;
    },
    enabled: !!platformId,
  });

  useEffect(() => {
    if (data && !isInitialized) {
      setSelectedEditionId(data.editionId);
      setSelectedDlcIds(new Set(data.ownedDlcIds));
      setIsInitialized(true);
    }
  }, [data, isInitialized]);

  const updateEditionMutation = useMutation({
    mutationFn: async (editionId: string | null) => {
      await ownershipAPI.setEdition(gameId, platformId, editionId);
      await completionLogsAPI.recalculate(gameId, platformId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ownership", gameId] }),
        queryClient.invalidateQueries({ queryKey: ["completionLogs", gameId] }),
        queryClient.invalidateQueries({ queryKey: ["additions", gameId] }),
        queryClient.invalidateQueries({ queryKey: ["game", gameId] }),
        queryClient.invalidateQueries({ queryKey: ["games"] }),
        queryClient.invalidateQueries({ queryKey: ["customFields", gameId, platformId] }),
      ]);
      showToast("Edition updated", "success");
    },
    onError: () => {
      showToast("Failed to update edition", "error");
    },
  });

  const updateDlcsMutation = useMutation({
    mutationFn: async (dlcIds: string[]) => {
      await ownershipAPI.setDlcs(gameId, platformId, dlcIds);
      await completionLogsAPI.recalculate(gameId, platformId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ownership", gameId] }),
        queryClient.invalidateQueries({ queryKey: ["completionLogs", gameId] }),
        queryClient.invalidateQueries({ queryKey: ["additions", gameId] }),
        queryClient.invalidateQueries({ queryKey: ["game", gameId] }),
        queryClient.invalidateQueries({ queryKey: ["games"] }),
        queryClient.invalidateQueries({ queryKey: ["customFields", gameId, platformId] }),
      ]);
      showToast("DLC ownership updated", "success");
    },
    onError: () => {
      showToast("Failed to update DLC ownership", "error");
    },
  });

  const handleEditionChange = (editionId: string | null) => {
    setSelectedEditionId(editionId);
    updateEditionMutation.mutate(editionId);
    setIsEditionOpen(false);
  };

  useEffect(() => {
    if (!isEditionOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (editionButtonRef.current?.contains(target) || editionListRef.current?.contains(target)) {
        return;
      }
      setIsEditionOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsEditionOpen(false);
        editionButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isEditionOpen]);

  const handleDlcToggle = (dlcId: string) => {
    const newSet = new Set(selectedDlcIds);
    if (newSet.has(dlcId)) {
      newSet.delete(dlcId);
    } else {
      newSet.add(dlcId);
    }
    setSelectedDlcIds(newSet);
    updateDlcsMutation.mutate(Array.from(newSet));
  };

  const handleSelectAllDlcs = () => {
    if (!data) return;
    const allDlcIds = data.dlcs.map((d) => d.id);
    setSelectedDlcIds(new Set(allDlcIds));
    updateDlcsMutation.mutate(allDlcIds);
  };

  const handleDeselectAllDlcs = () => {
    setSelectedDlcIds(new Set());
    updateDlcsMutation.mutate([]);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-1/3 rounded bg-elevated" />
        <div className="h-10 rounded bg-elevated" />
        <div className="h-24 rounded bg-elevated" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const hasEditions = data.editions.length > 0;
  const hasDlcs = data.dlcs.length > 0;
  const selectedEdition = data.editions.find((e) => e.id === selectedEditionId);
  const isCompleteEdition = selectedEdition?.is_complete_edition || false;

  if (!hasEditions && !hasDlcs) {
    return (
      <div className="text-sm italic text-text-muted">No editions or DLCs found for this game.</div>
    );
  }

  return (
    <div className="space-y-4">
      {hasEditions && (
        <div>
          <label
            htmlFor="edition-select"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            Which edition do you own?
          </label>
          <div className="relative" ref={editionListRef}>
            <Button
              ref={editionButtonRef}
              id="edition-select"
              type="button"
              onClick={() => setIsEditionOpen((prev) => !prev)}
              disabled={updateEditionMutation.isPending}
              aria-haspopup="listbox"
              aria-expanded={isEditionOpen}
              variant="ghost"
              className="flex h-auto w-full items-center justify-between gap-3 rounded-lg border border-elevated bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none disabled:opacity-50"
            >
              <span className="truncate text-sm text-text-primary">
                {selectedEdition
                  ? `${selectedEdition.name}${selectedEdition.is_complete_edition ? " (includes all DLCs)" : ""}`
                  : "Standard Edition (no DLCs included)"}
              </span>
              <svg
                className={`h-4 w-4 text-text-secondary transition-transform duration-quick ${isEditionOpen ? "rotate-180" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </Button>
            {isEditionOpen && (
              <div className="absolute z-20 mt-2 w-full rounded-lg border border-elevated bg-base shadow-lg">
                <ScrollFade axis="y" className="max-h-64 overflow-y-auto" role="listbox">
                  <Button
                    type="button"
                    onClick={() => handleEditionChange(null)}
                    variant="ghost"
                    className={`h-auto w-full px-3 py-2 text-left text-sm transition-colors ${
                      !selectedEditionId
                        ? "bg-accent/20 text-accent"
                        : "text-text-secondary hover:bg-surface hover:text-text-primary"
                    }`}
                    role="option"
                    aria-selected={!selectedEditionId}
                  >
                    Standard Edition (no DLCs included)
                  </Button>
                  {data.editions.map((edition) => (
                    <Button
                      key={edition.id}
                      type="button"
                      onClick={() => handleEditionChange(edition.id)}
                      variant="ghost"
                      className={`h-auto w-full px-3 py-2 text-left text-sm transition-colors ${
                        selectedEditionId === edition.id
                          ? "bg-accent/20 text-accent"
                          : "text-text-secondary hover:bg-surface hover:text-text-primary"
                      }`}
                      role="option"
                      aria-selected={selectedEditionId === edition.id}
                    >
                      <span className="block text-text-primary">{edition.name}</span>
                      {edition.is_complete_edition && (
                        <span className="block text-xs text-accent">Includes all DLCs</span>
                      )}
                    </Button>
                  ))}
                </ScrollFade>
              </div>
            )}
          </div>
          {isCompleteEdition && (
            <p className="mt-1 text-xs text-status-finished">
              This edition includes all DLCs - they will be counted in your progress.
            </p>
          )}
        </div>
      )}

      {hasDlcs && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              DLCs You Own {isCompleteEdition && "(all included)"}
            </span>
            {!isCompleteEdition && (
              <div className="flex gap-2">
                <Button
                  onClick={handleSelectAllDlcs}
                  disabled={updateDlcsMutation.isPending}
                  variant="link"
                  className="h-auto p-0 text-xs text-accent hover:text-accent disabled:opacity-50"
                >
                  Select All
                </Button>
                <span className="text-text-muted">|</span>
                <Button
                  onClick={handleDeselectAllDlcs}
                  disabled={updateDlcsMutation.isPending}
                  variant="link"
                  className="h-auto p-0 text-xs text-accent hover:text-accent disabled:opacity-50"
                >
                  Deselect All
                </Button>
              </div>
            )}
          </div>
          <ScrollFade axis="y" className="max-h-60 space-y-2 overflow-y-auto">
            {data.dlcs.map((dlc) => {
              const isOwned = isCompleteEdition || selectedDlcIds.has(dlc.id);
              return (
                <label
                  key={dlc.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                    isOwned
                      ? "bg-accent/10 border-accent"
                      : "bg-surface/50 border-elevated hover:border-elevated"
                  } ${isCompleteEdition ? "cursor-not-allowed opacity-75" : ""}`}
                >
                  <Checkbox
                    checked={isOwned}
                    onChange={() => handleDlcToggle(dlc.id)}
                    disabled={isCompleteEdition || updateDlcsMutation.isPending}
                  />
                  <div className="flex-1">
                    <span className="text-sm text-text-primary">{dlc.name}</span>
                    {dlc.required_for_full && (
                      <span className="ml-2 text-xs text-accent">(Required for Full)</span>
                    )}
                  </div>
                </label>
              );
            })}
          </ScrollFade>
          {!isCompleteEdition && selectedDlcIds.size > 0 && (
            <p className="mt-2 text-xs text-text-secondary">
              {selectedDlcIds.size} of {data.dlcs.length} DLCs owned
            </p>
          )}
        </div>
      )}
    </div>
  );
}
