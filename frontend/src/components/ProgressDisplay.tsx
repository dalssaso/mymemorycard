import { useQuery } from "@tanstack/react-query";
import { completionLogsAPI, type CompletionType } from "@/lib/api";
import { Link, useNavigate } from "@tanstack/react-router";
import { ClickableBadge } from "@/components/ui";

interface DLCSummary {
  dlcId: string;
  name: string;
  percentage: number;
  weight: number;
  requiredForFull: boolean;
  owned?: boolean;
}

interface CompletionSummary {
  main: number;
  full: number;
  completionist: number;
  dlcs: DLCSummary[];
  achievementPercentage: number;
  hasDlcs: boolean;
}

interface ProgressDisplayProps {
  gameId: string;
  platformId?: string;
}

const TYPE_COLORS: Record<CompletionType, string> = {
  main: "#10B981",
  dlc: "#8B5CF6",
  full: "#06B6D4",
  completionist: "#F59E0B",
};

export function ProgressDisplay({ gameId, platformId }: ProgressDisplayProps) {
  const navigate = useNavigate();

  const handleBadgeClick = (tab: "main" | "dlc" | "full" | "completionist") => {
    navigate({
      to: ".",
      hash: "stats",
      search: { tab },
    });
  };

  const { data, isLoading } = useQuery({
    queryKey: ["completionLogs", gameId, platformId],
    queryFn: async () => {
      const response = await completionLogsAPI.getAll(gameId, {
        limit: 1,
        ...(platformId && { platform_id: platformId }),
      });
      return response.data as {
        logs: unknown[];
        total: number;
        currentPercentage: number;
        summary: CompletionSummary;
      };
    },
  });

  if (isLoading) {
    return (
      <div className="bg-surface/50 animate-pulse rounded-lg p-3">
        <div className="bg-elevated mb-2 h-4 w-1/2 rounded" />
        <div className="bg-elevated h-6 w-1/3 rounded" />
      </div>
    );
  }

  const summary = data?.summary || {
    main: 0,
    full: 0,
    completionist: 0,
    dlcs: [],
    achievementPercentage: 100,
    hasDlcs: false,
  };
  const mainProgress = summary.main;
  const fullProgress = summary.full;
  const hasDlcs = summary.hasDlcs;

  return (
    <div className="bg-surface/50 border-elevated rounded-lg border p-3">
      <Link to="." hash="stats" className="group block transition-opacity hover:opacity-80">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-text-secondary group-hover:text-text-muted text-xs">
            {hasDlcs ? "Full Progress" : "Main Progress"}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="text-text-muted group-hover:text-accent h-3.5 w-3.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl font-bold"
            style={{ color: hasDlcs ? TYPE_COLORS.full : TYPE_COLORS.main }}
          >
            {hasDlcs ? fullProgress : mainProgress}
          </span>
          <span className="text-text-secondary text-sm">%</span>
        </div>
        <div className="bg-base mt-2 h-1.5 w-full rounded-full">
          <div
            className="h-1.5 rounded-full transition-all duration-200"
            style={{
              width: `${hasDlcs ? fullProgress : mainProgress}%`,
              backgroundColor: hasDlcs ? TYPE_COLORS.full : TYPE_COLORS.main,
            }}
          />
        </div>
      </Link>
      {(() => {
        const ownedDlcs = summary.dlcs.filter((d) => d.owned !== false);
        const hasAchievements =
          summary.achievementPercentage > 0 && summary.achievementPercentage < 100;
        const hasOwnedDlcsWithProgress =
          ownedDlcs.length > 0 && ownedDlcs.some((d) => d.percentage > 0);

        const shouldShowCompletionist =
          summary.completionist > 0 && (hasAchievements || hasOwnedDlcsWithProgress);

        return (
          <>
            {hasDlcs && (
              <div className="mt-2 flex flex-wrap gap-2">
                <ClickableBadge
                  label="Main"
                  percentage={mainProgress}
                  color={TYPE_COLORS.main}
                  onClick={() => handleBadgeClick("main")}
                />
                {ownedDlcs.length > 0 && (
                  <ClickableBadge
                    label="DLCs"
                    percentage={Math.floor(
                      ownedDlcs.reduce((acc, d) => acc + d.percentage, 0) / ownedDlcs.length
                    )}
                    color={TYPE_COLORS.dlc}
                    onClick={() => handleBadgeClick("dlc")}
                  />
                )}
                <ClickableBadge
                  label="Full"
                  percentage={fullProgress}
                  color={TYPE_COLORS.full}
                  onClick={() => handleBadgeClick("full")}
                />
              </div>
            )}
            {!hasDlcs && (
              <div className="mt-2 flex flex-wrap gap-2">
                <ClickableBadge
                  label="Main"
                  percentage={mainProgress}
                  color={TYPE_COLORS.main}
                  onClick={() => handleBadgeClick("main")}
                />
              </div>
            )}
            {shouldShowCompletionist && (
              <div className="mt-2">
                <ClickableBadge
                  label="Completionist"
                  percentage={summary.completionist}
                  color={TYPE_COLORS.completionist}
                  onClick={() => handleBadgeClick("completionist")}
                />
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
