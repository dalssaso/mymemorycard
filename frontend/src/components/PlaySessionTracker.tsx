import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, ScrollFade } from "@/components/ui";
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
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Play Sessions</h3>
        <div className="text-sm text-text-secondary">Total: {formatDuration(totalMinutes)}</div>
      </div>

      {activeSession && !isActiveForThisGame && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-400">
          You have an active session for another game: {activeSession.game_name}
        </div>
      )}

      {isActiveForThisGame ? (
        <div className="bg-accent/10 border-accent/30 rounded-lg border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm text-accent">Session in progress</div>
              <div className="mt-1 font-mono text-3xl text-text-primary">
                {formatElapsedTime(elapsedSeconds)}
              </div>
            </div>
            <Button
              onClick={() => activeSession && endSessionMutation.mutate(activeSession.id)}
              disabled={endSessionMutation.isPending}
              className="hover:bg-status-dropped/80 h-auto w-full bg-status-dropped px-6 py-3 text-base font-semibold sm:w-auto"
            >
              {endSessionMutation.isPending ? "Stopping..." : "Stop"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => startSessionMutation.mutate()}
            disabled={
              startSessionMutation.isPending || Boolean(activeSession && !isActiveForThisGame)
            }
            className="hover:bg-status-finished/80 h-auto w-full bg-status-finished py-3 text-base font-semibold sm:flex-1"
          >
            {startSessionMutation.isPending ? "Starting..." : "Start Session"}
          </Button>
          <Button
            variant={isManualMode ? "default" : "secondary"}
            onClick={() => setIsManualMode(!isManualMode)}
            className={`h-auto w-full px-4 py-3 font-semibold sm:w-auto ${
              isManualMode
                ? "hover:bg-accent/80 bg-accent text-base"
                : "bg-surface text-text-secondary hover:bg-elevated hover:text-text-primary"
            }`}
          >
            + Manual
          </Button>
        </div>
      )}

      {isManualMode && (
        <div className="bg-surface/50 space-y-3 rounded-lg p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="manual-date" className="mb-1 block text-sm text-text-secondary">
                Date
              </label>
              <Input
                id="manual-date"
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="border-elevated bg-base focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="manual-duration" className="mb-1 block text-sm text-text-secondary">
                Duration (minutes)
              </label>
              <Input
                id="manual-duration"
                type="number"
                min={1}
                placeholder="60"
                value={manualDuration}
                onChange={(e) => setManualDuration(e.target.value)}
                className="border-elevated bg-base focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label htmlFor="session-notes" className="mb-1 block text-sm text-text-secondary">
              Notes (optional)
            </label>
            <Input
              id="session-notes"
              type="text"
              placeholder="What did you do in this session?"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="border-elevated bg-base focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => addManualSessionMutation.mutate()}
              disabled={addManualSessionMutation.isPending || !manualDuration}
              className="hover:bg-accent/80 flex-1 bg-accent text-base font-semibold"
            >
              {addManualSessionMutation.isPending ? "Adding..." : "Add Session"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsManualMode(false);
                setManualDuration("");
                setSessionNotes("");
              }}
              className="flex-1 bg-elevated text-text-primary transition-colors duration-standard hover:bg-surface hover:opacity-90"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loadingSessions ? (
        <div className="text-sm text-text-secondary">Loading sessions...</div>
      ) : sessions.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-secondary">Recent Sessions</h4>
          <ScrollFade axis="y" className="max-h-64 space-y-2 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-surface/50 flex items-center justify-between rounded-lg p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">
                      {session.ended_at
                        ? formatDuration(session.duration_minutes || 0)
                        : "In progress"}
                    </span>
                    <span className="text-sm text-text-muted">
                      {new Date(session.started_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {session.notes && (
                    <p className="mt-1 text-sm text-text-secondary">{session.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSessionMutation.mutate(session.id)}
                  disabled={deleteSessionMutation.isPending || !session.ended_at}
                  className="h-8 w-8 text-text-muted hover:bg-transparent hover:text-status-dropped"
                  title={session.ended_at ? "Delete session" : "Cannot delete active session"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </Button>
              </div>
            ))}
          </ScrollFade>
        </div>
      ) : (
        <div className="py-4 text-center text-sm text-text-muted">
          No sessions recorded yet. Start tracking your playtime!
        </div>
      )}
    </div>
  );
}
