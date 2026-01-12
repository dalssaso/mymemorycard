import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui";
import { useState, useEffect, useRef, useCallback } from "react";

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

interface StartSessionButtonProps {
  gameId: string;
  platformId: string;
  onSessionChange?: () => void;
}

function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function StartSessionButton({
  gameId,
  platformId,
  onSessionChange,
}: StartSessionButtonProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  if (isActiveForThisGame) {
    return (
      <div className="bg-ctp-teal/10 border-ctp-teal/30 rounded-lg border p-3">
        <div className="text-ctp-teal mb-1 text-xs">Session in progress</div>
        <div className="text-ctp-text mb-2 font-mono text-xl">
          {formatElapsedTime(elapsedSeconds)}
        </div>
        <Button
          onClick={() => activeSession && endSessionMutation.mutate(activeSession.id)}
          disabled={endSessionMutation.isPending}
          variant="ghost"
          className="hover:bg-ctp-red/80 bg-ctp-red text-ctp-base h-auto w-full rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {endSessionMutation.isPending ? "Stopping..." : "Stop Session"}
        </Button>
      </div>
    );
  }

  if (activeSession && !isActiveForThisGame) {
    return (
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
        <div className="text-xs text-yellow-400">Active session on: {activeSession.game_name}</div>
      </div>
    );
  }

  return (
    <Button
      onClick={() => startSessionMutation.mutate()}
      disabled={startSessionMutation.isPending}
      variant="ghost"
      className="hover:bg-ctp-green/80 bg-ctp-green text-ctp-base flex h-auto w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path
          fillRule="evenodd"
          d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
          clipRule="evenodd"
        />
      </svg>
      {startSessionMutation.isPending ? "Starting..." : "Start Session"}
    </Button>
  );
}
