import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { statsAPI, type CombinedHeatmapDay, type CombinedHeatmapSummary } from "@/lib/api";
import { Button } from "@/components/ui";

interface ActivityHeatmapProps {
  type?: "activity" | "completion" | "achievement";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getLevel(value: number, maxValue: number): 0 | 1 | 2 | 3 | 4 {
  if (value === 0) return 0;
  const ratio = value / maxValue;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function ActivityHeatmap({ type = "activity" }: ActivityHeatmapProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [maxWeeks, setMaxWeeks] = useState(13);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    data: CombinedHeatmapDay | null;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const calculateMaxWeeks = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const dayLabelWidth = 35;
        const cellSize = 12;
        const availableWidth = containerWidth - dayLabelWidth;
        const weeks = Math.floor(availableWidth / cellSize);
        setMaxWeeks(Math.max(13, Math.min(53, weeks)));
      }
    };
    calculateMaxWeeks();
    window.addEventListener("resize", calculateMaxWeeks);
    return () => window.removeEventListener("resize", calculateMaxWeeks);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["combinedHeatmap", year],
    queryFn: async () => {
      const response = await statsAPI.getCombinedHeatmap(year);
      return response.data as {
        data: CombinedHeatmapDay[];
        summary: CombinedHeatmapSummary;
      };
    },
  });

  const { calendar, maxValue, monthLabels } = useMemo(() => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const dataMap = new Map<string, CombinedHeatmapDay>();

    if (data?.data) {
      data.data.forEach((d) => dataMap.set(d.date, d));
    }

    const weeks: Array<Array<{ date: Date; data: CombinedHeatmapDay | null } | null>> = [];
    let currentWeek: Array<{ date: Date; data: CombinedHeatmapDay | null } | null> = [];

    const startDayOfWeek = startDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    let maxVal = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayData = dataMap.get(dateStr) || null;

      let value = 0;
      if (dayData) {
        if (type === "activity") {
          value = dayData.sessions.count;
        } else if (type === "completion") {
          value = dayData.completions.count;
        } else {
          value = dayData.achievements.count;
        }
      }
      if (value > maxVal) {
        maxVal = value;
      }

      currentWeek.push({ date: new Date(currentDate), data: dayData });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    const labels: Array<{ month: string; weekIndex: number }> = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
      const validDay = week.find((d) => d !== null);
      if (validDay) {
        const month = validDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], weekIndex });
          lastMonth = month;
        }
      }
    });

    return { calendar: weeks, maxValue: maxVal || 1, monthLabels: labels };
  }, [year, data, type]);

  const { displayCalendar, displayMonthLabels } = useMemo(() => {
    if (maxWeeks >= calendar.length) {
      return { displayCalendar: calendar, displayMonthLabels: monthLabels };
    }

    const startIndex = Math.max(0, calendar.length - maxWeeks);
    const trimmedCalendar = calendar.slice(startIndex);

    const trimmedLabels = monthLabels
      .filter(({ weekIndex }) => weekIndex >= startIndex)
      .map(({ month, weekIndex }) => ({ month, weekIndex: weekIndex - startIndex }));

    return { displayCalendar: trimmedCalendar, displayMonthLabels: trimmedLabels };
  }, [calendar, monthLabels, maxWeeks]);

  const summary = data?.summary;

  const levelColors = {
    activity: [
      "var(--elevated)",
      "var(--accent)",
      "var(--accent)",
      "var(--accent)",
      "var(--accent)",
    ],
    completion: [
      "var(--elevated)",
      "var(--accent)",
      "var(--accent)",
      "var(--accent)",
      "var(--status-finished)",
    ],
    achievement: [
      "var(--elevated)",
      "var(--accent)",
      "var(--accent)",
      "var(--accent)",
      "var(--status-dropped)",
    ],
  };

  const colors = levelColors[type];

  const getValue = (dayData: CombinedHeatmapDay | null): number => {
    if (!dayData) return 0;
    if (type === "activity") return dayData.sessions.count;
    if (type === "completion") return dayData.completions.count;
    return dayData.achievements.count;
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex items-center justify-between">
        <h3 className="text-text-primary text-lg font-semibold">
          {type === "activity"
            ? "Play Activity"
            : type === "completion"
              ? "Completion Activity"
              : "Achievement Activity"}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setYear((y) => y - 1)}
            disabled={year <= 2020}
            variant="ghost"
            size="icon"
            className="text-text-secondary hover:text-text-primary h-auto w-auto p-1 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Button>
          <span className="text-text-primary min-w-[60px] text-center font-medium">{year}</span>
          <Button
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= currentYear}
            variant="ghost"
            size="icon"
            className="text-text-secondary hover:text-text-primary h-auto w-auto p-1 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="bg-surface/60 border-elevated/50 rounded-lg border p-3 shadow-sm">
            <div className="text-text-secondary text-xs">
              {type === "activity"
                ? "Total Sessions"
                : type === "completion"
                  ? "Total Progress Updates"
                  : "Achievements Unlocked"}
            </div>
            <div className="text-text-primary text-xl font-bold">
              {type === "activity"
                ? summary.totalSessions
                : type === "completion"
                  ? summary.totalCompletions
                  : summary.totalAchievements}
            </div>
          </div>
          {type === "activity" && (
            <div className="bg-surface/60 border-elevated/50 rounded-lg border p-3 shadow-sm">
              <div className="text-text-secondary text-xs">Total Playtime</div>
              <div className="text-status-finished text-xl font-bold">
                {formatMinutes(summary.totalMinutes)}
              </div>
            </div>
          )}
          <div className="bg-surface/60 border-elevated/50 rounded-lg border p-3 shadow-sm">
            <div className="text-text-secondary text-xs">Active Days</div>
            <div className="text-accent text-xl font-bold">{summary.activeDays}</div>
          </div>
          <div className="bg-surface/60 border-elevated/50 rounded-lg border p-3 shadow-sm">
            <div className="text-text-secondary text-xs">Current Streak</div>
            <div className="text-accent text-xl font-bold">
              {summary.currentStreak} {summary.currentStreak === 1 ? "day" : "days"}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-text-secondary flex h-[140px] items-center justify-center">
          Loading activity data...
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <div className="text-text-muted relative ml-7 h-4 text-xs">
            {displayMonthLabels.map(({ month, weekIndex }) => (
              <div
                key={`${month}-${weekIndex}`}
                className="absolute"
                style={{ left: weekIndex * 12 }}
              >
                {month}
              </div>
            ))}
          </div>
          <div className="flex gap-[2px]">
            <div className="text-text-muted mr-1 flex shrink-0 flex-col gap-[2px] text-xs">
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className="h-[10px] pr-1 text-right leading-[10px]"
                  style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="flex gap-[2px] overflow-hidden">
              {displayCalendar.map((week, weekIndex) => (
                <div key={weekIndex} className="flex shrink-0 flex-col gap-[2px]">
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return <div key={dayIndex} className="h-[10px] w-[10px]" />;
                    }
                    const value = getValue(day.data);
                    const level = getLevel(value, maxValue);
                    return (
                      <div
                        key={dayIndex}
                        className="hover:ring-text-primary h-[10px] w-[10px] cursor-pointer rounded-sm transition-all hover:ring-1"
                        style={{ backgroundColor: colors[level] }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay({
                            date: day.date.toLocaleDateString(),
                            data: day.data,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10,
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {hoveredDay && (
            <div
              className="border-elevated bg-base pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full transform rounded-lg border px-3 py-2 text-sm"
              style={{ left: hoveredDay.x, top: hoveredDay.y }}
            >
              <div className="text-text-primary mb-1 font-medium">{hoveredDay.date}</div>
              {hoveredDay.data ? (
                <div className="space-y-0.5">
                  {hoveredDay.data.sessions.count > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="bg-accent h-2 w-2 rounded-full" />
                      <span className="text-text-muted">
                        {hoveredDay.data.sessions.count} session
                        {hoveredDay.data.sessions.count > 1 ? "s" : ""}
                        {hoveredDay.data.sessions.minutes > 0 && (
                          <span className="text-text-muted">
                            {" "}
                            ({formatMinutes(hoveredDay.data.sessions.minutes)})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {hoveredDay.data.completions.count > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="bg-accent h-2 w-2 rounded-full" />
                      <span className="text-text-muted">
                        {hoveredDay.data.completions.count} progress update
                        {hoveredDay.data.completions.count > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  {hoveredDay.data.achievements.count > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="bg-accent h-2 w-2 rounded-full" />
                      <span className="text-text-muted">
                        {hoveredDay.data.achievements.count} achievement
                        {hoveredDay.data.achievements.count > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-text-muted">No activity</div>
              )}
            </div>
          )}

          <div className="text-text-muted mt-2 flex items-center justify-end gap-1 text-xs">
            <span>Less</span>
            {colors.map((color, i) => (
              <div
                key={i}
                className="h-[10px] w-[10px] rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  );
}
