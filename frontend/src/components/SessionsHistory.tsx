import { useRef, useState } from "react";
import type { PointerEvent } from "react";
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

interface SessionsHistoryProps {
  gameId: string;
  platformId: string;
  onSessionChange?: () => void;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function toLocalDateTimeString(isoString: string): string {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function SessionsHistory({ gameId, platformId, onSessionChange }: SessionsHistoryProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const swipeStartXRef = useRef(0);
  const swipeStartYRef = useRef(0);
  const swipeStartOffsetRef = useRef(0);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualDuration, setManualDuration] = useState("");
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [sessionNotes, setSessionNotes] = useState("");
  const [editingSession, setEditingSession] = useState<PlaySession | null>(null);
  const [editStartedAt, setEditStartedAt] = useState("");
  const [editEndedAt, setEditEndedAt] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);
  const [activeSwipeOffset, setActiveSwipeOffset] = useState(0);
  const [swipedSessionId, setSwipedSessionId] = useState<string | null>(null);

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ["sessions", gameId],
    queryFn: async () => {
      const response = await sessionsAPI.getAll(gameId, { limit: 20 });
      return response.data as {
        sessions: PlaySession[];
        total: number;
        totalMinutes: number;
      };
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

  const updateSessionMutation = useMutation({
    mutationFn: (data: {
      sessionId: string;
      startedAt: string;
      endedAt: string;
      notes: string | null;
    }) => {
      return sessionsAPI.update(gameId, data.sessionId, {
        startedAt: data.startedAt,
        endedAt: data.endedAt,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", gameId] });
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      setEditingSession(null);
      showToast("Session updated", "success");
      onSessionChange?.();
    },
    onError: () => {
      showToast("Failed to update session", "error");
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

  const handleEditClick = (session: PlaySession) => {
    setEditingSession(session);
    setEditStartedAt(toLocalDateTimeString(session.started_at));
    setEditEndedAt(session.ended_at ? toLocalDateTimeString(session.ended_at) : "");
    setEditNotes(session.notes || "");
  };

  const handleEditSave = () => {
    if (!editingSession || !editStartedAt || !editEndedAt) return;
    updateSessionMutation.mutate({
      sessionId: editingSession.id,
      startedAt: new Date(editStartedAt).toISOString(),
      endedAt: new Date(editEndedAt).toISOString(),
      notes: editNotes || null,
    });
  };

  const sessions = sessionsData?.sessions || [];
  const totalMinutes = sessionsData?.totalMinutes || 0;
  const maxSwipeOffset = 72;

  const handlePointerDown = (sessionId: string) => (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    swipeStartXRef.current = event.clientX;
    swipeStartYRef.current = event.clientY;
    swipeStartOffsetRef.current = swipedSessionId === sessionId ? -maxSwipeOffset : 0;
    setActiveSwipeId(sessionId);
    setActiveSwipeOffset(swipeStartOffsetRef.current);
    if (swipedSessionId && swipedSessionId !== sessionId) {
      setSwipedSessionId(null);
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (sessionId: string) => (event: PointerEvent<HTMLDivElement>) => {
    if (activeSwipeId !== sessionId) return;
    const currentX = event.clientX;
    const currentY = event.clientY;
    const deltaX = currentX - swipeStartXRef.current;
    const deltaY = currentY - swipeStartYRef.current;
    if (Math.abs(deltaX) < 4 && Math.abs(deltaY) < 4) return;
    if (Math.abs(deltaX) < Math.abs(deltaY)) return;

    const nextOffset = Math.max(-maxSwipeOffset, Math.min(0, swipeStartOffsetRef.current + deltaX));
    setActiveSwipeOffset(nextOffset);
  };

  const handlePointerEnd = (sessionId: string) => (event: PointerEvent<HTMLDivElement>) => {
    if (activeSwipeId !== sessionId) return;
    const shouldOpen = activeSwipeOffset <= -maxSwipeOffset / 2;
    setSwipedSessionId(shouldOpen ? sessionId : null);
    setActiveSwipeId(null);
    setActiveSwipeOffset(0);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-ctp-text text-lg font-semibold">Sessions History</h3>
          <div className="text-ctp-subtext0 text-sm">Total: {formatDuration(totalMinutes)}</div>
        </div>
        <Button
          variant={isManualMode ? "default" : "secondary"}
          onClick={() => setIsManualMode(!isManualMode)}
          className={`w-full sm:w-auto ${
            isManualMode
              ? "hover:bg-ctp-mauve/80 bg-ctp-mauve text-ctp-base"
              : "bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1 hover:text-ctp-text"
          }`}
        >
          + Add Manual
        </Button>
      </div>

      {isManualMode && (
        <div className="bg-ctp-surface0/50 space-y-3 rounded-lg p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="manual-date-history" className="text-ctp-subtext0 mb-1 block text-sm">
                Date
              </label>
              <Input
                id="manual-date-history"
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="border-ctp-surface1 bg-ctp-mantle focus:border-ctp-mauve"
              />
            </div>
            <div>
              <label
                htmlFor="manual-duration-history"
                className="text-ctp-subtext0 mb-1 block text-sm"
              >
                Duration (minutes)
              </label>
              <Input
                id="manual-duration-history"
                type="number"
                min={1}
                placeholder="60"
                value={manualDuration}
                onChange={(e) => setManualDuration(e.target.value)}
                className="border-ctp-surface1 bg-ctp-mantle focus:border-ctp-mauve"
              />
            </div>
          </div>
          <div>
            <label htmlFor="session-notes-history" className="text-ctp-subtext0 mb-1 block text-sm">
              Notes (optional)
            </label>
            <Input
              id="session-notes-history"
              type="text"
              placeholder="What did you do in this session?"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="border-ctp-surface1 bg-ctp-mantle focus:border-ctp-mauve"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => addManualSessionMutation.mutate()}
              disabled={addManualSessionMutation.isPending || !manualDuration}
              className="hover:bg-ctp-mauve/80 bg-ctp-mauve text-ctp-base flex-1 font-semibold"
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
              className="bg-ctp-surface1 text-ctp-text hover:bg-ctp-surface2 flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {editingSession && (
        <div className="bg-ctp-surface0/50 border-ctp-mauve/50 space-y-3 rounded-lg border p-4">
          <h4 className="text-ctp-text text-sm font-medium">Edit Session</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-started-at" className="text-ctp-subtext0 mb-1 block text-sm">
                Started At
              </label>
              <Input
                id="edit-started-at"
                type="datetime-local"
                value={editStartedAt}
                onChange={(e) => setEditStartedAt(e.target.value)}
                className="border-ctp-surface1 bg-ctp-mantle focus:border-ctp-mauve"
              />
            </div>
            <div>
              <label htmlFor="edit-ended-at" className="text-ctp-subtext0 mb-1 block text-sm">
                Ended At
              </label>
              <Input
                id="edit-ended-at"
                type="datetime-local"
                value={editEndedAt}
                onChange={(e) => setEditEndedAt(e.target.value)}
                className="border-ctp-surface1 bg-ctp-mantle focus:border-ctp-mauve"
              />
            </div>
          </div>
          <div>
            <label htmlFor="edit-notes" className="text-ctp-subtext0 mb-1 block text-sm">
              Notes (optional)
            </label>
            <Input
              id="edit-notes"
              type="text"
              placeholder="What did you do in this session?"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="border-ctp-surface1 bg-ctp-mantle focus:border-ctp-mauve"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={handleEditSave}
              disabled={updateSessionMutation.isPending || !editStartedAt || !editEndedAt}
              className="hover:bg-ctp-mauve/80 bg-ctp-mauve text-ctp-base flex-1 font-semibold"
            >
              {updateSessionMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setEditingSession(null)}
              className="bg-ctp-surface1 text-ctp-text hover:bg-ctp-surface2 flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loadingSessions ? (
        <div className="text-ctp-subtext0 text-sm">Loading sessions...</div>
      ) : sessions.length > 0 ? (
        <ScrollFade axis="y" className="max-h-96 space-y-2 overflow-y-auto">
          {sessions.map((session) => {
            const isSwiped = swipedSessionId === session.id;
            const isDragging = activeSwipeId === session.id;
            const translateX = isDragging ? activeSwipeOffset : isSwiped ? -maxSwipeOffset : 0;

            const showSwipeAction = isSwiped || isDragging;

            return (
              <div key={session.id} className="relative overflow-hidden rounded-lg">
                <div
                  className={`bg-ctp-red absolute inset-y-0 right-0 flex w-[72px] items-center justify-center transition-opacity md:hidden ${
                    showSwipeAction ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <Button
                    variant="ghost"
                    onClick={() => {
                      deleteSessionMutation.mutate(session.id);
                      setSwipedSessionId(null);
                    }}
                    disabled={deleteSessionMutation.isPending || !session.ended_at}
                    className="text-ctp-base text-sm font-semibold hover:bg-transparent disabled:opacity-60"
                    aria-label={
                      session.ended_at ? "Delete session" : "Cannot delete active session"
                    }
                  >
                    Delete
                  </Button>
                </div>
                <div
                  className={`bg-ctp-surface0 flex w-full touch-pan-y items-center justify-between rounded-lg p-3 transition-transform ${
                    isDragging ? "" : "duration-200 ease-out"
                  }`}
                  style={{ transform: `translateX(${translateX}px)` }}
                  onPointerDown={handlePointerDown(session.id)}
                  onPointerMove={handlePointerMove(session.id)}
                  onPointerUp={handlePointerEnd(session.id)}
                  onPointerCancel={handlePointerEnd(session.id)}
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
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {session.notes && (
                      <p className="text-ctp-subtext0 mt-1 text-sm">{session.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {session.ended_at && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(session)}
                        className="text-ctp-overlay1 hover:text-ctp-teal h-8 w-8 hover:bg-transparent"
                        title="Edit session"
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
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                          />
                        </svg>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSessionMutation.mutate(session.id)}
                      disabled={deleteSessionMutation.isPending || !session.ended_at}
                      className="text-ctp-overlay1 hover:text-ctp-red hidden h-8 w-8 hover:bg-transparent md:inline-flex"
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
                </div>
              </div>
            );
          })}
        </ScrollFade>
      ) : (
        <div className="bg-ctp-surface0/30 text-ctp-overlay1 rounded-lg py-8 text-center text-sm">
          No sessions recorded yet
        </div>
      )}
    </div>
  );
}
