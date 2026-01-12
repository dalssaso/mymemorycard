import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useSearch, useNavigate } from "@tanstack/react-router";
import {
  Button,
  Input,
  ScrollFade,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { completionLogsAPI, additionsAPI, type CompletionType, type GameAddition } from "@/lib/api";

interface CompletionLog {
  id: string;
  user_id: string;
  game_id: string;
  platform_id: string;
  completion_type: CompletionType;
  dlc_id: string | null;
  percentage: number;
  logged_at: string;
  notes: string | null;
  game_name?: string;
  platform_name?: string;
  dlc_name?: string;
}

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

interface ProgressHistoryProps {
  gameId: string;
  platformId: string;
  onProgressChange?: () => void;
}

type TabType = "main" | "dlc" | "full" | "completionist";
type RangeOption = "1d" | "30d" | "3mo" | "6mo" | "12mo";

const TAB_COLORS: Record<TabType, string> = {
  main: "#10B981",
  dlc: "#8B5CF6",
  full: "#06B6D4",
  completionist: "#F59E0B",
};

const QUICK_PRESETS = [25, 50, 75, 100];
const RANGE_OPTIONS: Array<{ value: RangeOption; label: string }> = [
  { value: "1d", label: "Last 1d" },
  { value: "30d", label: "Last 30d" },
  { value: "3mo", label: "Last 3mo" },
  { value: "6mo", label: "Last 6mo" },
  { value: "12mo", label: "Last 12mo" },
];

const clampPercentage = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

const getRangeStart = (range: RangeOption): Date => {
  const now = new Date();
  const start = new Date(now);
  if (range === "1d") {
    start.setDate(now.getDate() - 1);
  } else if (range === "30d") {
    start.setDate(now.getDate() - 30);
  } else if (range === "3mo") {
    start.setMonth(now.getMonth() - 3);
  } else if (range === "6mo") {
    start.setMonth(now.getMonth() - 6);
  } else {
    start.setFullYear(now.getFullYear() - 1);
  }
  return start;
};

export function ProgressHistory({ gameId, platformId, onProgressChange }: ProgressHistoryProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("main");
  const [selectedDlcId, setSelectedDlcId] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const [percentageInput, setPercentageInput] = useState<string>("");
  const [isEditingPercentage, setIsEditingPercentage] = useState(false);
  const [notes, setNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [selectedRange, setSelectedRange] = useState<RangeOption>("3mo");

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["completionLogs", gameId, platformId],
    queryFn: async () => {
      const response = await completionLogsAPI.getAll(gameId, {
        limit: 100,
        platform_id: platformId,
      });
      return response.data as {
        logs: CompletionLog[];
        total: number;
        currentPercentage: number;
        summary: CompletionSummary;
        achievementHistory?: Array<{ percentage: number; logged_at: string; notes: string }>;
        fullProgressHistory?: Array<{ percentage: number; logged_at: string; notes: string }>;
      };
    },
  });

  const { data: additionsData } = useQuery({
    queryKey: ["additions", gameId, platformId],
    queryFn: async () => {
      const response = await additionsAPI.getAll(gameId, platformId);
      return response.data as {
        additions: GameAddition[];
        total: number;
        hasDlcs: boolean;
      };
    },
  });

  const summary = useMemo(
    () =>
      logsData?.summary ?? {
        main: 0,
        full: 0,
        completionist: 0,
        dlcs: [],
        achievementPercentage: 100,
        hasDlcs: false,
      },
    [logsData?.summary]
  );
  const hasDlcs = useMemo(
    () => additionsData?.hasDlcs ?? summary.hasDlcs,
    [additionsData?.hasDlcs, summary.hasDlcs]
  );
  const additions = useMemo(() => additionsData?.additions ?? [], [additionsData?.additions]);

  const getCurrentPercentage = (): number => {
    if (activeTab === "main") return summary.main;
    if (activeTab === "full") return summary.full;
    if (activeTab === "completionist") return summary.completionist;
    if (activeTab === "dlc" && selectedDlcId) {
      const dlc = summary.dlcs.find((d) => d.dlcId === selectedDlcId);
      return dlc?.percentage || 0;
    }
    return 0;
  };

  const currentPercentage = getCurrentPercentage();
  const displayValue = sliderValue ?? currentPercentage;
  const activeColor = TAB_COLORS[activeTab];

  useEffect(() => {
    if (!isEditingPercentage) {
      setPercentageInput(String(displayValue));
    }
  }, [displayValue, isEditingPercentage]);

  const manualLogs = (logsData?.logs || []).filter((log) => {
    if (activeTab === "main") return log.completion_type === "main";
    if (activeTab === "full") return log.completion_type === "full";
    if (activeTab === "completionist") return log.completion_type === "completionist";
    if (activeTab === "dlc") return log.completion_type === "dlc" && log.dlc_id === selectedDlcId;
    return false;
  });

  const achievementHistoryData = logsData?.achievementHistory || [];
  const fullProgressHistoryData = logsData?.fullProgressHistory || [];

  let logs: typeof manualLogs = manualLogs;

  if (activeTab === "main" && achievementHistoryData.length > 0) {
    logs = [
      ...achievementHistoryData.map((h) => ({
        id: `achievement-${h.logged_at}`,
        user_id: "",
        game_id: gameId,
        platform_id: platformId,
        completion_type: "main" as CompletionType,
        dlc_id: null,
        percentage: h.percentage,
        logged_at: h.logged_at,
        notes: h.notes,
      })),
      ...manualLogs.filter(
        (log) =>
          !achievementHistoryData.some(
            (h) =>
              Math.abs(new Date(h.logged_at).getTime() - new Date(log.logged_at).getTime()) < 1000
          )
      ),
    ].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
  } else if (activeTab === "full" && fullProgressHistoryData.length > 0) {
    logs = [
      ...fullProgressHistoryData.map((h) => ({
        id: `full-${h.logged_at}`,
        user_id: "",
        game_id: gameId,
        platform_id: platformId,
        completion_type: "full" as CompletionType,
        dlc_id: null,
        percentage: h.percentage,
        logged_at: h.logged_at,
        notes: h.notes,
      })),
      ...manualLogs.filter(
        (log) =>
          !fullProgressHistoryData.some(
            (h) =>
              Math.abs(new Date(h.logged_at).getTime() - new Date(log.logged_at).getTime()) < 1000
          )
      ),
    ].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
  }

  const logProgressMutation = useMutation({
    mutationFn: () =>
      completionLogsAPI.create(gameId, {
        platformId,
        percentage: displayValue,
        completionType: activeTab === "dlc" ? "dlc" : "main",
        dlcId: activeTab === "dlc" ? selectedDlcId : null,
        notes: notes || null,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["completionLogs", gameId] });
      queryClient.invalidateQueries({ queryKey: ["additions", gameId] });
      queryClient.invalidateQueries({ queryKey: ["customFields", gameId, platformId] });
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
      setSliderValue(null);
      setNotes("");

      const data = response.data as { statusChanged?: boolean; newStatus?: string };
      if (data.statusChanged && data.newStatus) {
        const statusLabel = data.newStatus.charAt(0).toUpperCase() + data.newStatus.slice(1);
        showToast(`Progress logged - Game moved to "${statusLabel}"`, "success");
      } else {
        showToast("Progress logged", "success");
      }
      onProgressChange?.();
    },
    onError: () => {
      showToast("Failed to log progress", "error");
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: (logId: string) => completionLogsAPI.delete(gameId, logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["completionLogs", gameId] });
      queryClient.invalidateQueries({ queryKey: ["additions", gameId] });
      queryClient.invalidateQueries({ queryKey: ["customFields", gameId, platformId] });
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      showToast("Log entry deleted", "success");
      onProgressChange?.();
    },
    onError: () => {
      showToast("Failed to delete log entry", "error");
    },
  });

  const hasChanged = sliderValue !== null && sliderValue !== currentPercentage;
  const canEdit = activeTab === "main" || (activeTab === "dlc" && selectedDlcId);

  const rangeStart = getRangeStart(selectedRange);
  const rangeLogs = logs.filter((log) => new Date(log.logged_at) >= rangeStart);
  const chartData = [...rangeLogs].reverse().map((log) => ({
    date: new Date(log.logged_at).toLocaleDateString(),
    percentage: log.percentage,
  }));

  const handleTabChange = (tab: TabType) => {
    navigate({
      to: ".",
      hash: "stats",
      search: { tab },
    });
    setSliderValue(null);
    setNotes("");
  };

  const handleSliderChange = (value: number) => {
    const clamped = clampPercentage(value);
    setSliderValue(clamped);
    setPercentageInput(String(clamped));
  };

  const handlePercentageChange = (value: string) => {
    setPercentageInput(value);
    if (!value.trim()) {
      return;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      setSliderValue(clampPercentage(parsed));
    }
  };

  const handlePercentageBlur = () => {
    if (!percentageInput.trim()) {
      setSliderValue(null);
      setPercentageInput(String(currentPercentage));
      return;
    }
    const parsed = Number(percentageInput);
    if (Number.isNaN(parsed)) {
      setSliderValue(null);
      setPercentageInput(String(currentPercentage));
      return;
    }
    const clamped = clampPercentage(parsed);
    setSliderValue(clamped);
    setPercentageInput(String(clamped));
  };

  const getTabLabel = (tab: TabType): string => {
    if (tab === "main") return "Main";
    if (tab === "dlc") return "DLCs";
    if (tab === "full") return "Full";
    return "Completionist";
  };

  const getTabPercentage = (tab: TabType): number => {
    if (tab === "main") return summary.main;
    if (tab === "full") return summary.full;
    if (tab === "completionist") return summary.completionist;
    if (tab === "dlc") {
      const dlcs = summary.dlcs;
      if (dlcs.length === 0) return 0;
      const avg = dlcs.reduce((acc, d) => acc + d.percentage, 0) / dlcs.length;
      return Math.floor(avg);
    }
    return 0;
  };

  const visibleTabs = useMemo<TabType[]>(
    () => (hasDlcs ? ["main", "dlc", "full", "completionist"] : ["main", "full", "completionist"]),
    [hasDlcs]
  );

  const searchParams = useSearch({ from: "/library/$id" });

  // Sync activeTab with URL search params
  useEffect(() => {
    if (searchParams.tab && visibleTabs.includes(searchParams.tab as TabType)) {
      setActiveTab(searchParams.tab as TabType);

      // Auto-select first DLC if tab is 'dlc' but no DLC selected yet
      if (searchParams.tab === "dlc" && additions.length > 0 && !selectedDlcId) {
        setSelectedDlcId(additions[0].id);
      }
    }
  }, [searchParams.tab, visibleTabs, additions, selectedDlcId]);

  return (
    <div className="space-y-4">
      <h3 className="text-ctp-text text-lg font-semibold">Progress Over Time</h3>

      <div className="bg-ctp-surface0/50 flex gap-1 rounded-lg p-1">
        {visibleTabs.map((tab) => (
          <Button
            key={tab}
            variant="ghost"
            onClick={() => handleTabChange(tab)}
            className={`h-auto flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${
              activeTab === tab
                ? "text-ctp-text shadow-sm"
                : "hover:bg-ctp-surface1/50 text-ctp-subtext0 hover:text-ctp-text"
            }`}
            style={
              activeTab === tab
                ? { backgroundColor: TAB_COLORS[tab] + "30", color: TAB_COLORS[tab] }
                : {}
            }
          >
            <div className="flex flex-col">
              <div>{getTabLabel(tab)}</div>
              <div className="text-[10px] opacity-70">{getTabPercentage(tab)}%</div>
            </div>
          </Button>
        ))}
      </div>

      {activeTab === "dlc" && additions.length > 0 && (
        <div className="space-y-2">
          <p className="text-ctp-subtext0 text-xs">Select DLC (only owned DLCs affect progress)</p>
          <ScrollFade axis="y" className="max-h-60 space-y-2 overflow-y-auto">
            {additions.map((dlc) => {
              const dlcSummary = summary.dlcs.find((d) => d.dlcId === dlc.id);
              const pct = dlcSummary?.percentage || 0;
              const isOwned = dlcSummary?.owned ?? dlc.owned;
              return (
                <Button
                  key={dlc.id}
                  variant="ghost"
                  onClick={() => {
                    setSelectedDlcId(dlc.id);
                    setSliderValue(null);
                    setNotes("");
                  }}
                  className={`h-auto w-full rounded-lg border p-3 text-left ${
                    selectedDlcId === dlc.id
                      ? "border-purple-500 bg-purple-500/10"
                      : isOwned
                        ? "bg-ctp-surface0/50 border-ctp-surface1 hover:border-ctp-surface2"
                        : "bg-ctp-mantle/30 border-ctp-surface0 opacity-60 hover:opacity-80"
                  }`}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-ctp-text truncate text-sm font-medium">
                          {dlc.name}
                        </span>
                        {!isOwned && (
                          <span className="bg-ctp-surface0 text-ctp-overlay1 rounded px-1.5 py-0.5 text-[10px]">
                            Not Owned
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold" style={{ color: TAB_COLORS.dlc }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="bg-ctp-surface1 mt-1 h-1.5 w-full rounded-full">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: TAB_COLORS.dlc }}
                      />
                    </div>
                    {dlc.released && (
                      <span className="text-ctp-overlay1 mt-1 block text-[10px]">
                        Released: {new Date(dlc.released).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Button>
              );
            })}
          </ScrollFade>
        </div>
      )}

      {activeTab === "dlc" && additions.length === 0 && (
        <div className="bg-ctp-surface0/50 text-ctp-subtext0 rounded-lg p-4 text-sm">
          No DLCs found for this game.
        </div>
      )}

      {(activeTab === "full" || activeTab === "completionist") && (
        <div className="bg-ctp-surface0/50 space-y-3 rounded-lg p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-ctp-subtext0 text-sm">
              {activeTab === "full" ? "Full Game Progress" : "Completionist Progress"}
            </span>
            <span className="text-2xl font-bold" style={{ color: activeColor }}>
              {currentPercentage}%
            </span>
          </div>
          <div className="bg-ctp-surface1 h-2 w-full rounded-full">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${currentPercentage}%`, backgroundColor: activeColor }}
            />
          </div>
          <p className="text-ctp-overlay1 text-xs">
            {activeTab === "full"
              ? "Auto-calculated from Main + all DLCs completion"
              : "Auto-calculated from Full game + Achievements completion"}
          </p>
          {activeTab === "completionist" && (
            <div className="text-ctp-subtext0 mt-2 flex flex-wrap gap-4 text-xs">
              <span>Full: {summary.full}%</span>
              <span>Achievements: {summary.achievementPercentage}%</span>
            </div>
          )}
        </div>
      )}

      {canEdit && (
        <div className="bg-ctp-mantle/70 border-ctp-surface0 space-y-4 rounded-xl border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h4 className="text-ctp-text text-sm font-semibold">
                {activeTab === "main"
                  ? "Main Story"
                  : additions.find((d) => d.id === selectedDlcId)?.name || "DLC"}{" "}
                Progress
              </h4>
              <p className="text-ctp-overlay1 text-xs">
                {activeTab === "main" ? "Main story completion" : "DLC/Expansion content"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                value={percentageInput}
                onChange={(event) => handlePercentageChange(event.target.value)}
                onFocus={() => setIsEditingPercentage(true)}
                onBlur={() => {
                  setIsEditingPercentage(false);
                  handlePercentageBlur();
                }}
                aria-label="Progress percentage"
                className="progress-percentage-input bg-ctp-crust/70 border-ctp-surface1 focus:border-ctp-mauve w-16 text-center text-2xl font-bold sm:w-20"
              />
              <span className="text-ctp-subtext0 text-sm">%</span>
            </div>
          </div>

          <div className="relative h-3">
            <div className="bg-ctp-surface0 absolute inset-0 rounded-full" />
            <div
              className="absolute inset-0 rounded-full transition-all duration-200"
              style={{ width: `${displayValue}%`, backgroundColor: activeColor }}
            />
            <Input
              type="range"
              min={0}
              max={100}
              value={displayValue}
              onChange={(event) => handleSliderChange(parseInt(event.target.value, 10))}
              className="progress-slider-inline absolute inset-0 h-3 w-full"
              style={{ accentColor: activeColor }}
              aria-label="Progress slider"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_PRESETS.map((value) => (
              <Button
                key={value}
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => handleSliderChange(value)}
                className={`bg-ctp-mantle/80 h-auto rounded-full border px-3 py-1.5 text-xs font-medium ${
                  displayValue === value
                    ? "bg-opacity-20"
                    : "border-ctp-surface1/80 text-ctp-subtext0 hover:text-ctp-text"
                }`}
                style={
                  displayValue === value
                    ? {
                        borderColor: activeColor,
                        color: activeColor,
                        backgroundColor: activeColor + "15",
                      }
                    : {}
                }
              >
                {value}%
              </Button>
            ))}
          </div>

          {displayValue === 100 && (
            <div className="bg-ctp-surface0/50 text-ctp-subtext0 rounded-lg px-3 py-2 text-xs">
              Logging Completionist will update the Full and Completionist progress automatically
            </div>
          )}

          {hasChanged && (
            <div className="border-ctp-surface0/80 mt-1 space-y-3 border-t pt-3">
              <Input
                type="text"
                placeholder="Add a note about this update (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-ctp-crust/80 border-ctp-surface1 focus:border-ctp-mauve focus:ring-ctp-mauve text-sm focus:ring-1"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setSliderValue(null);
                    setNotes("");
                  }}
                  className="bg-ctp-mantle/60 hover:bg-ctp-surface0/80 border-ctp-surface1 text-ctp-subtext1 w-full text-sm sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => logProgressMutation.mutate()}
                  disabled={logProgressMutation.isPending}
                  className="w-full text-sm font-semibold sm:w-auto"
                  style={{ backgroundColor: activeColor, color: "#111" }}
                >
                  {logProgressMutation.isPending ? "Saving..." : "Log Progress"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {(chartData.length > 0 || logs.length > 0) && (
        <div className="bg-ctp-mantle/60 border-ctp-surface0/80 rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-ctp-subtext0 text-xs font-semibold uppercase tracking-wide">
                {getTabLabel(activeTab)} Trend
              </h4>
              {rangeLogs[0] && (
                <span className="text-ctp-overlay1 text-xs">
                  Last: {new Date(rangeLogs[0].logged_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="text-ctp-subtext0 text-xs">
              <span className="sr-only">Select range</span>
              <Select
                value={selectedRange}
                onValueChange={(value) => setSelectedRange(value as RangeOption)}
              >
                <SelectTrigger
                  aria-label="Select range"
                  className="border-ctp-surface1 bg-ctp-mantle text-ctp-text focus:ring-ctp-mauve h-7 w-[110px] text-xs"
                >
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent>
                  {RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <SelectItemText>{option.label}</SelectItemText>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#71717A", fontSize: 10 }}
                  axisLine={{ stroke: "#3f3f46" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#71717A", fontSize: 10 }}
                  axisLine={{ stroke: "#3f3f46" }}
                  tickLine={false}
                  width={25}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value: number) => [`${value}%`, "Completion"]}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke={activeColor}
                  strokeWidth={2}
                  dot={{ fill: activeColor, strokeWidth: 0, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="bg-ctp-surface0/50 text-ctp-subtext0 rounded-lg p-3 text-xs">
              No progress logged in this range yet.
            </div>
          )}
        </div>
      )}

      {logs.length > 0 && (
        <div className="bg-ctp-mantle/40 border-ctp-surface0/60 rounded-xl border p-3">
          <Button
            variant="ghost"
            onClick={() => setShowHistory(!showHistory)}
            className="text-ctp-subtext0 hover:text-ctp-text flex h-auto w-full items-center justify-between p-0 text-xs hover:bg-transparent"
          >
            <span className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`h-4 w-4 transition-transform ${showHistory ? "rotate-90" : ""}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              History ({logs.length} {logs.length === 1 ? "entry" : "entries"})
            </span>
            <span className="text-ctp-overlay1 text-xs">{showHistory ? "Hide" : "View"}</span>
          </Button>

          {showHistory && (
            <ScrollFade axis="y" className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-ctp-mantle/70 flex items-start justify-between rounded-lg p-2.5"
                >
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium" style={{ color: activeColor }}>
                        {log.percentage}%
                      </span>
                      <span className="text-ctp-overlay1 text-xs">
                        {new Date(log.logged_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-ctp-subtext0 mt-1 line-clamp-2 text-xs">{log.notes}</p>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLogMutation.mutate(log.id)}
                      disabled={deleteLogMutation.isPending}
                      className="text-ctp-overlay1 hover:text-ctp-red h-7 w-7 p-1.5 hover:bg-transparent"
                      title="Delete log entry"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
            </ScrollFade>
          )}
        </div>
      )}

      {isLoading && <div className="text-ctp-subtext0 text-sm">Loading progress history...</div>}
    </div>
  );
}
