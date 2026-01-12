import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, ScrollFade } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { displayEditionAPI, type DisplayEditionData, type RawgEditionOption } from "@/lib/api";

interface EditionSwitcherProps {
  gameId: string;
  platformId: string;
}

export function EditionSwitcher({ gameId, platformId }: EditionSwitcherProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["displayEdition", gameId, platformId],
    queryFn: async () => {
      const response = await displayEditionAPI.get(gameId, platformId);
      return response.data as DisplayEditionData;
    },
    enabled: !!platformId,
  });

  const setEditionMutation = useMutation({
    mutationFn: (edition: RawgEditionOption) =>
      displayEditionAPI.set(gameId, {
        platformId,
        rawgEditionId: edition.rawg_id,
        editionName: edition.name,
        coverArtUrl: edition.cover_url,
        backgroundImageUrl: edition.background_url,
        description: edition.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["displayEdition", gameId] });
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
      showToast("Display edition updated", "success");
      setIsExpanded(false);
    },
    onError: () => {
      showToast("Failed to update display edition", "error");
    },
  });

  const resetEditionMutation = useMutation({
    mutationFn: () => displayEditionAPI.reset(gameId, platformId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["displayEdition", gameId] });
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
      showToast("Reset to base game", "success");
    },
    onError: () => {
      showToast("Failed to reset edition", "error");
    },
  });

  if (isLoading) {
    return <div className="bg-elevated h-10 animate-pulse rounded" />;
  }

  const hasEditions = data && data.availableEditions.length > 0;
  const isUsingEdition = data?.isUsingEdition;

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-3">
      {isUsingEdition && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetEditionMutation.mutate()}
            disabled={resetEditionMutation.isPending}
            className="border-elevated bg-surface text-text-muted hover:border-accent hover:bg-elevated hover:text-accent text-xs"
          >
            Reset to Base Game
          </Button>
        </div>
      )}

      {isUsingEdition && data?.currentDisplay && (
        <div className="bg-accent/10 border-accent/30 rounded-lg border p-3">
          <div className="text-text-primary whitespace-normal break-words text-sm">
            {data.currentDisplay.edition_name}
          </div>
          <div className="text-accent mt-1 text-xs">Currently displaying</div>
        </div>
      )}

      {!isUsingEdition && data?.baseGame && (
        <div className="bg-surface/50 border-elevated rounded-lg border p-3">
          <div className="text-text-primary whitespace-normal break-words text-sm">
            {data.baseGame.name}
          </div>
          <div className="text-text-muted mt-1 text-xs">Base game</div>
        </div>
      )}

      {hasEditions && (
        <>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border-elevated bg-surface text-text-muted hover:bg-elevated w-full justify-between text-sm"
          >
            <span>Switch to Different Edition</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </Button>

          {isExpanded && (
            <ScrollFade axis="y" className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {data.availableEditions.map((edition) => (
                <Button
                  variant="outline"
                  key={edition.rawg_id}
                  onClick={() => setEditionMutation.mutate(edition)}
                  disabled={setEditionMutation.isPending}
                  className="bg-base/50 border-elevated hover:border-accent hover:bg-base w-full justify-start gap-3 p-3 text-left disabled:opacity-50"
                >
                  {edition.cover_url && (
                    <img
                      src={edition.cover_url}
                      alt={edition.name}
                      className="h-20 w-16 shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-text-primary whitespace-normal break-words text-sm leading-snug">
                      {edition.name}
                    </div>
                    <div className="text-accent mt-2 text-xs">
                      Click to use this edition&apos;s metadata
                    </div>
                  </div>
                </Button>
              ))}
            </ScrollFade>
          )}
        </>
      )}

      <p className="text-text-muted text-xs">
        Switching editions changes the displayed name, cover art, and description. Achievements are
        always from the base game.
      </p>
    </div>
  );
}
