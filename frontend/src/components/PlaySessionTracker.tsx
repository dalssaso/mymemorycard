import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollFade } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { sessionsAPI } from "@/lib/api";

interface PlaySession {
  id: string;
  user_id: string;
  game_id: string;
  platform_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  game_name?: string;
  platform_name?: string;
}

interface PlaySessionTrackerProps {
  gameId: string;
  platformId: string;
  onSessionChange?: () => void;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function PlaySessionTracker({
  gameId,
  platformId,
  onSessionChange,
}: PlaySessionTrackerProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualDuration, setManualDuration] = useState("");
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [sessionNotes, setSessionNotes] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ["sessions", gameId],
    queryFn: async () => {
      const response = await sessionsAPI.getAll(gameId, { limit: 10 });
      return response.data as {
        sessions: PlaySession[];
        total: number;
        totalMinutes: number;
      };
    },
  });

  const { data: activeSessionData } = useQuery({
    queryKey: ["activeSession"],
    queryFn: async () => {
      const response = await sessionsAPI.getActive();
      return response.data as { session: PlaySession | null };
    },
  });

  const activeSession = activeSessionData?.session;
  const isActiveForThisGame = activeSession?.game_id === gameId;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isActiveForThisGame && activeSession) {
      const startTime = new Date(activeSession.started_at).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
      startTimer();
    } else {
      stopTimer();
      setElapsedSeconds(0);
    }

    return () => stopTimer();
  }, [isActiveForThisGame, activeSession, startTimer, stopTimer]);

  const startSessionMutation = useMutation({
    mutationFn: () =>
      sessionsAPI.create(gameId, {
        platformId,
        startedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      queryClient.invalidateQueries({ queryKey: ["sessions", gameId] });
      showToast("Session started", "success");
      onSessionChange?.();
    },
    onError: () => {
      showToast("Failed to start session", "error");
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: (sessionId: string) =>
      sessionsAPI.update(gameId, sessionId, {
        endedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      queryClient.invalidateQueries({ queryKey: ["sessions", gameId] });
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      showToast("Session ended", "success");
      onSessionChange?.();
    },
    onError: () => {
      showToast("Failed to end session", "error");
    },
  });

  const addManualSessionMutation = useMutation({
    mutationFn: () => {
      const durationMinutes = parseInt(manualDuration);
      if (isNaN(durationMinutes) || durationMinutes <= 0) {
        throw new Error("Invalid duration");
      }
      const startedAt = new Date(manualDate);
      const endedAt = new Date(startedAt.getTime() + durationMinutes * 60000);
      return sessionsAPI.create(gameId, {
        platformId,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMinutes,
        notes: sessionNotes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", gameId] });
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      setManualDuration("");
      setSessionNotes("");
      setIsManualMode(false);
      showToast("Session added", "success");
      onSessionChange?.();
    },
    onError: () => {
      showToast("Failed to add session", "error");
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsAPI.delete(gameId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", gameId] });
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      showToast("Session deleted", "success");
      onSessionChange?.();
    },
    onError: () => {
      showToast("Failed to delete session", "error");
    },
  });

  const sessions = sessionsData?.sessions || [];
  const totalMinutes = sessionsData?.totalMinutes || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-ctp-text">Play Sessions</h3>
        <div className="text-sm text-ctp-subtext0">Total: {formatDuration(totalMinutes)}</div>
      </div>

      {activeSession && !isActiveForThisGame && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-400">
          You have an active session for another game: {activeSession.game_name}
        </div>
      )}

      {isActiveForThisGame ? (
        <div className="bg-ctp-teal/10 border border-ctp-teal/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-ctp-teal">Session in progress</div>
              <div className="text-3xl font-mono text-ctp-text mt-1">
                {formatElapsedTime(elapsedSeconds)}
              </div>
            </div>
            <button
              onClick={() => activeSession && endSessionMutation.mutate(activeSession.id)}
              disabled={endSessionMutation.isPending}
              className="px-6 py-3 bg-ctp-red hover:bg-ctp-red/80 text-ctp-base rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {endSessionMutation.isPending ? "Stopping..." : "Stop"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => startSessionMutation.mutate()}
            disabled={
              startSessionMutation.isPending || Boolean(activeSession && !isActiveForThisGame)
            }
            className="flex-1 py-3 bg-ctp-green hover:bg-ctp-green/80 text-ctp-base rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {startSessionMutation.isPending ? "Starting..." : "Start Session"}
          </button>
          <button
            onClick={() => setIsManualMode(!isManualMode)}
            className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
              isManualMode
                ? "bg-ctp-mauve text-ctp-base"
                : "bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1 hover:text-ctp-text"
            }`}
          >
            + Manual
          </button>
        </div>
      )}

      {isManualMode && (
        <div className="bg-ctp-surface0/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="manual-date" className="block text-sm text-ctp-subtext0 mb-1">
                Date
              </label>
              <input
                id="manual-date"
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg px-3 py-2 text-ctp-text focus:outline-none focus:border-ctp-mauve"
              />
            </div>
            <div>
              <label htmlFor="manual-duration" className="block text-sm text-ctp-subtext0 mb-1">
                Duration (minutes)
              </label>
              <input
                id="manual-duration"
                type="number"
                min="1"
                placeholder="60"
                value={manualDuration}
                onChange={(e) => setManualDuration(e.target.value)}
                className="w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg px-3 py-2 text-ctp-text focus:outline-none focus:border-ctp-mauve"
              />
            </div>
          </div>
          <div>
            <label htmlFor="session-notes" className="block text-sm text-ctp-subtext0 mb-1">
              Notes (optional)
            </label>
            <input
              id="session-notes"
              type="text"
              placeholder="What did you do in this session?"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg px-3 py-2 text-ctp-text focus:outline-none focus:border-ctp-mauve"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => addManualSessionMutation.mutate()}
              disabled={addManualSessionMutation.isPending || !manualDuration}
              className="flex-1 py-2 bg-ctp-mauve hover:bg-ctp-mauve/80 text-ctp-base rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {addManualSessionMutation.isPending ? "Adding..." : "Add Session"}
            </button>
            <button
              onClick={() => {
                setIsManualMode(false);
                setManualDuration("");
                setSessionNotes("");
              }}
              className="px-4 py-2 bg-ctp-surface1 hover:bg-gray-600 text-ctp-text rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loadingSessions ? (
        <div className="text-ctp-subtext0 text-sm">Loading sessions...</div>
      ) : sessions.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-ctp-subtext0">Recent Sessions</h4>
          <ScrollFade axis="y" className="space-y-2 max-h-64 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between bg-ctp-surface0/50 rounded-lg p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-ctp-text font-medium">
                      {session.ended_at
                        ? formatDuration(session.duration_minutes || 0)
                        : "In progress"}
                    </span>
                    <span className="text-ctp-overlay1 text-sm">
                      {new Date(session.started_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {session.notes && (
                    <p className="text-sm text-ctp-subtext0 mt-1">{session.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteSessionMutation.mutate(session.id)}
                  disabled={deleteSessionMutation.isPending || !session.ended_at}
                  className="p-2 text-ctp-overlay1 hover:text-ctp-red transition-colors disabled:opacity-50"
                  title={session.ended_at ? "Delete session" : "Cannot delete active session"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </ScrollFade>
        </div>
      ) : (
        <div className="text-ctp-overlay1 text-sm text-center py-4">
          No sessions recorded yet. Start tracking your playtime!
        </div>
      )}
    </div>
  );
}
