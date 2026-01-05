import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gamesAPI } from "@/lib/api";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";

interface RawgIdCorrectionProps {
  gameId: string;
  currentRawgId: number | null;
  gameName: string;
}

export function RawgIdCorrection({ gameId, currentRawgId, gameName }: RawgIdCorrectionProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [rawgInput, setRawgInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (options: { rawgId?: number; rawgSlug?: string }) =>
      gamesAPI.updateFromRawg(gameId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
      showToast("Game metadata updated from RAWG", "success");
      setIsExpanded(false);
      setRawgInput("");
      setError(null);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      const message = err.response?.data?.error || "Failed to update game metadata";
      setError(message);
      showToast(message, "error");
    },
  });

  const handleSubmit = () => {
    setError(null);
    const input = rawgInput.trim();

    if (!input) {
      setError("Please enter a RAWG URL or slug");
      return;
    }

    // Check if it's a numeric ID
    const numericId = parseInt(input, 10);
    if (!isNaN(numericId) && numericId > 0 && String(numericId) === input) {
      updateMutation.mutate({ rawgId: numericId });
      return;
    }

    // Otherwise treat it as a slug
    updateMutation.mutate({ rawgSlug: input });
  };

  const extractRawgSlug = (input: string): string => {
    // Extract slug from URL like https://rawg.io/games/god-of-war-2
    const urlMatch = input.match(/rawg\.io\/games\/([^/\s?#]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // Already a slug or ID
    return input;
  };

  const handleInputChange = (value: string) => {
    setError(null);
    const extracted = extractRawgSlug(value.trim());
    setRawgInput(extracted);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ctp-subtext0">RAWG ID</span>
        {currentRawgId && (
          <span className="text-xs text-ctp-overlay1">Current: {currentRawgId}</span>
        )}
      </div>

      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="outline"
        className="w-full justify-between border-ctp-surface2 bg-ctp-surface0 text-sm text-ctp-subtext1 hover:bg-ctp-surface1"
      >
        <span>Correct Game Metadata</span>
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
        <div className="bg-ctp-mantle/50 space-y-4 rounded-lg border border-ctp-surface1 p-4">
          <div className="text-sm text-ctp-subtext1">
            <p className="mb-2">
              If this game has wrong metadata (wrong cover, wrong description, etc.), you can
              correct it by providing the correct RAWG game page URL.
            </p>
          </div>

          <div className="bg-ctp-teal/10 border-ctp-teal/30 rounded-lg border p-3">
            <p className="mb-2 text-sm font-medium text-ctp-teal">How to find the correct game:</p>
            <ol className="list-inside list-decimal space-y-1.5 text-xs text-ctp-subtext1">
              <li>
                Go to{" "}
                <a
                  href={`https://rawg.io/search?query=${encodeURIComponent(gameName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ctp-teal hover:underline"
                >
                  RAWG.io and search for &quot;{gameName}&quot;
                </a>
              </li>
              <li>Click on the correct game in the results</li>
              <li>
                Copy the URL from your browser (e.g.,{" "}
                <code className="rounded bg-ctp-surface0 px-1">
                  rawg.io/games/<strong>god-of-war-2</strong>
                </code>
                )
              </li>
              <li>Paste the URL or just the slug below</li>
            </ol>
          </div>

          <div>
            <label htmlFor="rawg-input" className="mb-2 block text-sm text-ctp-subtext0">
              RAWG URL or Slug
            </label>
            <Input
              id="rawg-input"
              type="text"
              value={rawgInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="e.g., god-of-war-2 or https://rawg.io/games/god-of-war-2"
              className="bg-ctp-surface0 text-ctp-text placeholder:text-ctp-overlay1 focus-visible:ring-ctp-teal"
            />
            {error && <p className="mt-2 text-sm text-ctp-red">{error}</p>}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending || !rawgInput}
              className="hover:bg-ctp-mauve/80 flex-1 bg-ctp-mauve text-ctp-base"
            >
              {updateMutation.isPending ? "Updating..." : "Update Metadata"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsExpanded(false);
                setRawgInput("");
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-ctp-overlay1">
            This will update the game&apos;s name, cover art, description, genres, and other
            metadata from RAWG.
          </p>
        </div>
      )}
    </div>
  );
}
