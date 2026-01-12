import { useQuery } from "@tanstack/react-query";
import { useSidebar } from "@/contexts/SidebarContext";
import { aiAPI } from "@/lib/api";
import { Link } from "@tanstack/react-router";

export function AICuratorSidebar() {
  const { isCollapsed } = useSidebar();

  const { data: settingsData } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const response = await aiAPI.getSettings();
      return response.data;
    },
  });

  const { data: activityData } = useQuery({
    queryKey: ["ai-activity"],
    queryFn: async () => {
      const response = await aiAPI.getActivity(10);
      return response.data;
    },
  });

  if (isCollapsed) {
    return (
      <div className="space-y-3 border-t border-surface pt-3">
        <div className="flex justify-center">
          <Link
            to="/settings"
            className="rounded-lg p-2 text-text-secondary transition-all duration-standard hover:bg-surface hover:text-text-primary"
            title="AI Settings"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Settings Link */}
      <Link
        to="/settings"
        className="hover:bg-accent/80 flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-text-primary transition-colors duration-standard"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        AI Settings
      </Link>

      {/* Current Configuration */}
      {settingsData?.activeProvider && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            <svg
              className="h-4 w-4 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Active Configuration
          </h3>
          <div className="space-y-2 rounded-lg bg-surface p-3">
            <div>
              <p className="text-xs text-text-muted">Provider</p>
              <p className="text-sm font-medium capitalize text-text-primary">
                {settingsData.activeProvider.provider}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Text Model</p>
              <p className="truncate text-sm font-medium text-text-primary">
                {settingsData.activeProvider.model}
              </p>
            </div>
            {settingsData.activeProvider.image_model && (
              <div>
                <p className="text-xs text-text-muted">Image Model</p>
                <p className="truncate text-sm font-medium text-text-primary">
                  {settingsData.activeProvider.image_model}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {activityData && activityData.logs.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            <svg
              className="h-4 w-4 text-status-finished"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Recent Activity
          </h3>
          <div className="space-y-2">
            {activityData.logs.slice(0, 5).map((log) => (
              <div key={log.id} className="rounded-lg bg-surface p-2">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span className="flex-1 text-xs font-medium text-text-primary">
                    {log.actionType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  {log.success ? (
                    <svg
                      className="h-3 w-3 flex-shrink-0 text-status-finished"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-3 w-3 flex-shrink-0 text-status-dropped"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  {log.estimatedCostUsd !== null && <span>${log.estimatedCostUsd.toFixed(4)}</span>}
                  {log.durationMs !== null && <span>{(log.durationMs / 1000).toFixed(1)}s</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {activityData && activityData.logs.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            <svg
              className="h-4 w-4 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Usage Stats
          </h3>
          <div className="space-y-2">
            <div className="rounded-lg bg-surface p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Total Requests</span>
                <span className="text-sm font-semibold text-text-primary">
                  {activityData.logs.length}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-surface p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Success Rate</span>
                <span className="text-sm font-semibold text-text-primary">
                  {Math.round(
                    (activityData.logs.filter((log) => log.success).length /
                      activityData.logs.length) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-surface p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Total Cost</span>
                <span className="text-sm font-semibold text-text-primary">
                  $
                  {activityData.logs
                    .reduce((sum, log) => sum + (log.estimatedCostUsd || 0), 0)
                    .toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          <svg
            className="h-4 w-4 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          About
        </h3>
        <div className="space-y-2 text-xs text-text-secondary">
          <p>
            The AI Curator uses your configured AI provider to analyze your game library and provide
            personalized suggestions.
          </p>
          <p className="text-text-muted">
            Each action has an estimated cost shown before execution. Actual costs may vary
            slightly.
          </p>
        </div>
      </div>
    </div>
  );
}
