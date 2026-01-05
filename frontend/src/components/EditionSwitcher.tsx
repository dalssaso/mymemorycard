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
    return <div className="h-10 animate-pulse rounded bg-ctp-surface1" />;
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
            className="border-ctp-surface1 bg-ctp-surface0 text-xs text-ctp-subtext1 hover:border-ctp-teal hover:bg-ctp-surface1 hover:text-ctp-teal"
          >
            Reset to Base Game
          </Button>
        </div>
      )}

      {isUsingEdition && data?.currentDisplay && (
        <div className="bg-ctp-mauve/10 border-ctp-mauve/30 rounded-lg border p-3">
          <div className="whitespace-normal break-words text-sm text-ctp-text">
            {data.currentDisplay.edition_name}
          </div>
          <div className="mt-1 text-xs text-ctp-mauve">Currently displaying</div>
        </div>
      )}

      {!isUsingEdition && data?.baseGame && (
        <div className="bg-ctp-surface0/50 rounded-lg border border-ctp-surface1 p-3">
          <div className="whitespace-normal break-words text-sm text-ctp-text">
            {data.baseGame.name}
          </div>
          <div className="mt-1 text-xs text-ctp-overlay1">Base game</div>
        </div>
      )}

      {hasEditions && (
        <>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-between border-ctp-surface2 bg-ctp-surface0 text-sm text-ctp-subtext1 hover:bg-ctp-surface1"
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
                  className="bg-ctp-mantle/50 w-full justify-start gap-3 border-ctp-surface1 p-3 text-left hover:border-ctp-mauve hover:bg-ctp-mantle disabled:opacity-50"
                >
                  {edition.cover_url && (
                    <img
                      src={edition.cover_url}
                      alt={edition.name}
                      className="h-20 w-16 shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="whitespace-normal break-words text-sm leading-snug text-ctp-text">
                      {edition.name}
                    </div>
                    <div className="mt-2 text-xs text-ctp-teal">
                      Click to use this edition&apos;s metadata
                    </div>
                  </div>
                </Button>
              ))}
            </ScrollFade>
          )}
        </>
      )}

      <p className="text-xs text-ctp-overlay1">
        Switching editions changes the displayed name, cover art, and description. Achievements are
        always from the base game.
      </p>
    </div>
  );
}
