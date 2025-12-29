import { useQuery } from '@tanstack/react-query'
import { useSidebar } from '@/contexts/SidebarContext'
import { aiAPI } from '@/lib/api'
import { Link } from '@tanstack/react-router'

export function AICuratorSidebar() {
  const { isCollapsed } = useSidebar()

  const { data: settingsData } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      const response = await aiAPI.getSettings()
      return response.data
    },
  })

  const { data: activityData } = useQuery({
    queryKey: ['ai-activity'],
    queryFn: async () => {
      const response = await aiAPI.getActivity(10)
      return response.data
    },
  })

  if (isCollapsed) {
    return (
      <div className="space-y-3 pt-3 border-t border-ctp-surface0">
        <div className="flex justify-center">
          <Link
            to="/settings"
            className="p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
            title="AI Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Settings Link */}
      <Link
        to="/settings"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-ctp-mauve hover:bg-ctp-mauve/80 text-ctp-base rounded-lg transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        AI Settings
      </Link>

      {/* Current Configuration */}
      {settingsData?.activeProvider && (
        <div>
          <h3 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-ctp-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Active Configuration
          </h3>
          <div className="p-3 bg-ctp-surface0 rounded-lg space-y-2">
            <div>
              <p className="text-xs text-ctp-overlay1">Provider</p>
              <p className="text-sm text-ctp-text font-medium capitalize">
                {settingsData.activeProvider.provider}
              </p>
            </div>
            <div>
              <p className="text-xs text-ctp-overlay1">Text Model</p>
              <p className="text-sm text-ctp-text font-medium truncate">
                {settingsData.activeProvider.model}
              </p>
            </div>
            {settingsData.activeProvider.image_model && (
              <div>
                <p className="text-xs text-ctp-overlay1">Image Model</p>
                <p className="text-sm text-ctp-text font-medium truncate">
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
          <h3 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-ctp-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Activity
          </h3>
          <div className="space-y-2">
            {activityData.logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-2 bg-ctp-surface0 rounded-lg"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs text-ctp-text font-medium flex-1">
                    {log.actionType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  {log.success ? (
                    <svg className="w-3 h-3 text-ctp-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-ctp-red flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-ctp-overlay1">
                  {log.estimatedCostUsd !== null && (
                    <span>${log.estimatedCostUsd.toFixed(4)}</span>
                  )}
                  {log.durationMs !== null && (
                    <span>{(log.durationMs / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {activityData && activityData.logs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-ctp-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Usage Stats
          </h3>
          <div className="space-y-2">
            <div className="p-2 bg-ctp-surface0 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ctp-subtext0">Total Requests</span>
                <span className="text-sm text-ctp-text font-semibold">
                  {activityData.logs.length}
                </span>
              </div>
            </div>
            <div className="p-2 bg-ctp-surface0 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ctp-subtext0">Success Rate</span>
                <span className="text-sm text-ctp-text font-semibold">
                  {Math.round(
                    (activityData.logs.filter((log) => log.success).length /
                      activityData.logs.length) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>
            <div className="p-2 bg-ctp-surface0 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ctp-subtext0">Total Cost</span>
                <span className="text-sm text-ctp-text font-semibold">
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
        <h3 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-ctp-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          About
        </h3>
        <div className="text-xs text-ctp-subtext0 space-y-2">
          <p>
            The AI Curator uses your configured AI provider to analyze your game library and provide
            personalized suggestions.
          </p>
          <p className="text-ctp-overlay1">
            Each action has an estimated cost shown before execution. Actual costs may vary slightly.
          </p>
        </div>
      </div>
    </div>
  )
}
